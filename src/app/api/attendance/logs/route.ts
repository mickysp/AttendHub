import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { currentUser } from "@/lib/admin-auth";
import type { AttendanceLogDocument, CheckInLog } from "@/types/attendance-log";
import type { SessionDocument } from "@/types/session";

const getNowTH = () => new Date();

const getDateTH = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
  }).format(date);

const getAcademicYear = () => Number(getDateTH(new Date()).slice(0, 4)) + 543;

function createSessionDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`);
}

function isSessionEnded(session: SessionDocument) {
  if (!session.date || !session.endTime) {
    return false;
  }

  const now = getNowTH();
  const end = createSessionDateTime(session.date, session.endTime);

  return now > end;
}

export async function GET(req: Request) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเข้าสู่ระบบ",
          logs: [],
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");

    if (!classId || !studentId) {
      return NextResponse.json(
        {
          success: false,
          message: "missing params",
          logs: [],
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceLogDocument>("attendance");
    const sessionsCol = db.collection<SessionDocument>("sessions");
    const yearParam = searchParams.get("year");
    const academicYear = yearParam ? Number(yearParam) : getAcademicYear();

    if (!Number.isInteger(academicYear) || academicYear <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid academic year",
          logs: [],
        },
        { status: 400 },
      );
    }

    const classConditions: (string | ObjectId)[] = [classId];

    if (ObjectId.isValid(classId)) {
      classConditions.push(new ObjectId(classId));
    }

    const sessions = await sessionsCol
      .find({
        classId: {
          $in: classConditions,
        },
        academicYear,
      })
      .sort({
        date: -1,
        startTime: -1,
      })
      .toArray();

    const attendanceRecords = await attendanceCol
      .find({
        classId: {
          $in: classConditions,
        },
        studentId: {
          $in: [studentId],
        },
        academicYear,
      })
      .toArray();

    const attendanceMap = new Map<string, AttendanceLogDocument>(
      attendanceRecords.map((record) => [String(record.sessionId), record]),
    );

    const logs: CheckInLog[] = sessions.map((session) => {
      const attendance = attendanceMap.get(String(session._id));

      if (attendance) {
        return {
          date: attendance.date,
          time: attendance.createdAt,
          timeText: attendance.checkInHour || "-",
          status: attendance.status,
          score: attendance.score || 0,
        };
      }

      const ended = isSessionEnded(session);

      return {
        date: session.date,
        timeText: "-",
        status: ended ? "ขาด" : "ยังไม่เช็คชื่อ",
        score: 0,
      };
    });

    return NextResponse.json({
      success: true,
      studentId,
      academicYear,
      totalLogs: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Attendance Logs API Error:", error);

    return NextResponse.json(
      {
        success: false,
        logs: [],
        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 },
    );
  }
}
