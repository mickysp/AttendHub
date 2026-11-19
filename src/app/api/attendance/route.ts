import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type AttendanceStatusResult =
  | {
      success: true;
      status: "มาเรียน" | "มาสาย";
      score: number;
    }
  | {
      success: false;
      message: string;
    };

const getNowTH = () => new Date();

const getDateTH = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
  }).format(date);

const getAcademicYear = () => Number(getDateTH(new Date()).slice(0, 4)) + 543;

function isValidDateTime(date: unknown, time: unknown): boolean {
  if (
    typeof date !== "string" ||
    typeof time !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    return false;
  }

  const parsed = new Date(`${date}T${time}:00+07:00`);

  return !Number.isNaN(parsed.getTime()) && getDateTH(parsed) === date;
}

function createSessionDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00+07:00`);
}

function getAttendanceStatus(session: {
  date: string;
  startTime: string;
  endTime: string;
  lateAfter: number;
}): AttendanceStatusResult {
  const now = getNowTH();

  const start = createSessionDateTime(session.date, session.startTime);

  const end = createSessionDateTime(session.date, session.endTime);

  const late = new Date(start);
  late.setMinutes(late.getMinutes() + session.lateAfter);

  if (now < start) {
    return {
      success: false,
      message: "ยังไม่เปิดเช็คชื่อ",
    };
  }

  if (now > end) {
    return {
      success: false,
      message: "หมดเวลาเช็คชื่อแล้ว",
    };
  }

  if (now <= late) {
    return {
      success: true,
      status: "มาเรียน",
      score: 1,
    };
  }

  return {
    success: true,
    status: "มาสาย",
    score: 0.5,
  };
}

export async function POST(req: Request) {
  try {
    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบ JSON ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบข้อมูลไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    const { classId, sessionId, studentId } = body as {
      classId?: unknown;
      sessionId?: unknown;
      studentId?: unknown;
    };

    if (
      typeof classId !== "string" ||
      typeof sessionId !== "string" ||
      typeof studentId !== "string" ||
      !classId.trim() ||
      !sessionId.trim() ||
      !studentId.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณากรอกข้อมูลให้ครบถ้วน",
        },
        { status: 400 },
      );
    }

    const cleanClassId = classId.trim();
    const cleanSessionId = sessionId.trim();
    const cleanStudentId = studentId.trim();

    if (cleanStudentId.length > 30 || cleanClassId.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "ข้อมูลมีความยาวไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(cleanSessionId)) {
      return NextResponse.json(
        {
          success: false,
          message: "sessionId ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const sessionsCol = db.collection("sessions");
    const attendanceCol = db.collection("attendance");
    const studentsCol = db.collection("students");
    const studentClassesCol = db.collection("student_classes");
    const sessionObjectId = new ObjectId(cleanSessionId);

    const session = await sessionsCol.findOne({
      _id: sessionObjectId,
    });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูล Session",
        },
        { status: 404 },
      );
    }

    if (!session.classId || String(session.classId) !== cleanClassId) {
      return NextResponse.json(
        {
          success: false,
          message: "Session นี้ไม่ได้อยู่ในรายวิชาที่ระบุ",
        },
        { status: 403 },
      );
    }

    if (
      !isValidDateTime(session.date, session.startTime) ||
      !isValidDateTime(session.date, session.endTime)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "วันที่หรือเวลา Session ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    const nowTH = getNowTH();
    const todayTH = getDateTH(nowTH);

    if (todayTH < session.date) {
      return NextResponse.json(
        {
          success: false,
          message: "ยังไม่ถึงวันเรียน",
        },
        { status: 400 },
      );
    }

    if (todayTH > session.date) {
      return NextResponse.json(
        {
          success: false,
          message: "หมดเวลาเช็คชื่อแล้ว กรุณาใช้ Session ล่าสุด",
        },
        { status: 400 },
      );
    }

    const startTime = createSessionDateTime(session.date, session.startTime);

    const endTime = createSessionDateTime(session.date, session.endTime);

    if (endTime <= startTime) {
      return NextResponse.json(
        {
          success: false,
          message: "เวลาเลิกเรียนต้องอยู่หลังเวลาเริ่มเรียน",
        },
        { status: 400 },
      );
    }

    if (session.allowCheckIn === false) {
      return NextResponse.json(
        {
          success: false,
          message: "อาจารย์ปิดการเช็คชื่อ",
        },
        { status: 403 },
      );
    }

    if (session.isOpen === false) {
      return NextResponse.json(
        {
          success: false,
          message: "Session ยังไม่เปิดใช้งาน",
        },
        { status: 403 },
      );
    }

    const student = await studentsCol.findOne({
      studentId: cleanStudentId,
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบรหัสนักศึกษาในระบบ",
        },
        { status: 404 },
      );
    }

    const studentRelation = await studentClassesCol.findOne({
      $and: [
        {
          $or: [
            { studentId: cleanStudentId },
            { studentId: student._id.toString() },
            { studentId: student._id },
          ],
        },
        {
          $or: [
            { classId: session.classId },
            { classId: String(session.classId) },
          ],
        },
      ],
    });

    if (!studentRelation) {
      return NextResponse.json(
        {
          success: false,
          message: "นักศึกษาไม่ได้ลงทะเบียนในรายวิชานี้",
        },
        { status: 403 },
      );
    }

    const academicYear = getAcademicYear();

    const exist = await attendanceCol.findOne({
      sessionId: sessionObjectId,
      studentId: cleanStudentId,
    });

    if (exist) {
      return NextResponse.json(
        {
          success: false,
          message: "คุณเช็คชื่อใน Session นี้แล้ว",
        },
        { status: 409 },
      );
    }

    const lateAfter =
      Number.isInteger(session.lateAfter) &&
      session.lateAfter >= 0 &&
      session.lateAfter <= 180
        ? session.lateAfter
        : 15;

    const attendanceResult = getAttendanceStatus({
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime,
      lateAfter,
    });

    if (!attendanceResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: attendanceResult.message,
        },
        { status: 400 },
      );
    }

    const insertData = {
      sessionId: sessionObjectId,
      classId: session.classId,
      className: session.className || "",
      studentId: cleanStudentId,
      name: student.fullName || "",
      section: student.section || "",
      email: student.email || "",
      academicYear,
      date: session.date,
      checkInTime: nowTH,
      checkInHour: nowTH.toLocaleTimeString("th-TH", {
        timeZone: "Asia/Bangkok",
      }),
      status: attendanceResult.status,
      score: attendanceResult.score,
      createdAt: nowTH,
      updatedAt: nowTH,
    };

    try {
      await attendanceCol.insertOne(insertData);
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "คุณเช็คชื่อใน Session นี้แล้ว",
          },
          { status: 409 },
        );
      }

      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: "เช็คชื่อสำเร็จ",
        data: {
          studentId: cleanStudentId,
          sessionId: cleanSessionId,
          sessionDate: session.date,
          checkInTime: nowTH,
          status: attendanceResult.status,
          score: attendanceResult.score,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Attendance Check-in Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการเช็คชื่อ กรุณาลองใหม่อีกครั้ง",
      },
      { status: 500 },
    );
  }
}
