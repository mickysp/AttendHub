import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";
import { currentUser } from "@/lib/admin-auth";
import type {
  AttendanceDocument,
  AttendanceAggregate,
  StudentAttendance,
} from "@/types/attendance";
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
          data: [],
          majorsByClass: [],
        },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const yearParam = searchParams.get("year");

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message: "missing classId",
          data: [],
          majorsByClass: [],
        },
        { status: 400 },
      );
    }

    const academicYear = yearParam ? Number(yearParam) : getAcademicYear();

    if (!Number.isInteger(academicYear) || academicYear <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid academic year",
          data: [],
          majorsByClass: [],
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const attendanceCol = db.collection<AttendanceDocument>("attendance");
    const studentClassesCol = db.collection<Document>("student_classes");
    const studentsCol = db.collection<Document>("students");
    const sessionsCol = db.collection<SessionDocument>("sessions");

    const classFilter = ObjectId.isValid(classId)
      ? new ObjectId(classId)
      : classId;

    const classConditions = [classFilter, classId];

    const studentClasses = await studentClassesCol
      .find({
        classId: {
          $in: classConditions,
        },
        academicYear,
      })
      .toArray();

    const studentObjectIds = studentClasses
      .map((s) => s.studentId)
      .filter(Boolean);

    const students = await studentsCol
      .find({
        _id: {
          $in: studentObjectIds,
        },
      })
      .toArray();

    const sessions = await sessionsCol
      .find({
        classId: {
          $in: classConditions,
        },
        academicYear,
      })
      .sort({
        date: 1,
        startTime: 1,
      })
      .toArray();

    const totalSessions = sessions.length;
    const latestSession = sessions[sessions.length - 1];
    const latestDate = latestSession?.date || null;
    const endedSessions = sessions.filter(isSessionEnded);
    const totalEndedSessions = endedSessions.length;
    const attendanceRecords = await attendanceCol
      .find({
        classId: {
          $in: classConditions,
        },
        academicYear,
      })
      .toArray();

    const attendanceSummary = await attendanceCol
      .aggregate<AttendanceAggregate>([
        {
          $match: {
            classId: {
              $in: classConditions,
            },
            academicYear,
          },
        },
        {
          $sort: {
            date: 1,
            createdAt: 1,
          },
        },
        {
          $group: {
            _id: "$studentId",

            totalScore: {
              $sum: {
                $ifNull: ["$score", 0],
              },
            },

            days: {
              $sum: 1,
            },

            lateDays: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$status", "มาสาย"],
                  },
                  1,
                  0,
                ],
              },
            },

            lastStatus: {
              $last: "$status",
            },

            lastAttendanceDate: {
              $last: "$date",
            },

            lastCheckInTime: {
              $last: "$checkInTime",
            },

            lastCheckInHour: {
              $last: "$checkInHour",
            },
          },
        },
      ])
      .toArray();

    const attendanceMap = new Map(
      attendanceSummary.map((a) => [String(a._id), a]),
    );

    const result: StudentAttendance[] = students.map((student) => {
      const studentId = String(student.studentId || "");

      const summary = attendanceMap.get(studentId);

      const attendedDays = summary?.days || 0;

      const absentDays = endedSessions.filter((session) => {
        return !attendanceRecords.find(
          (record) =>
            String(record.studentId) === studentId &&
            String(record.sessionId) === String(session._id),
        );
      }).length;

      let status: StudentAttendance["status"] = "ยังไม่เช็คชื่อ";

      if (summary?.lastStatus) {
        status = summary.lastStatus;
      } else if (absentDays > 0) {
        status = "ขาด";
      }

      const totalScore = summary?.totalScore || 0;

      return {
        studentId,
        name: student.fullName || student.name || "",
        email: student.email || student.studentEmail || "-",
        section: student.section || "-",
        major: student.major || student.branch || "-",
        status,
        score: totalScore,
        attendanceDate:
          summary?.lastAttendanceDate || (absentDays > 0 ? latestDate : null),
        checkInTime:
          summary?.lastCheckInHour ||
          (summary?.lastCheckInTime
            ? new Date(summary.lastCheckInTime).toLocaleTimeString("th-TH", {
                timeZone: "Asia/Bangkok",
                hour: "2-digit",
                minute: "2-digit",
              })
            : null),

        totalScore,
        days: attendedDays,
        absentDays,
        lateDays: summary?.lateDays || 0,
        averageScore:
          attendedDays > 0 ? Number((totalScore / attendedDays).toFixed(2)) : 0,
      };
    });

    const majorsByClass = [
      ...new Set(
        result
          .map((r) => r.major?.trim())
          .filter((m): m is string => Boolean(m && m !== "-")),
      ),
    ].sort();

    return NextResponse.json({
      success: true,
      academicYear,
      latestSessionDate: latestDate,
      totalSessions,
      totalEndedSessions,
      data: result,
      majorsByClass,
    });
  } catch (error) {
    console.error("Attendance Summary API Error:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
        majorsByClass: [],
        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 },
    );
  }
}
