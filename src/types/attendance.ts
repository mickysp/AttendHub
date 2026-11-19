import type { ObjectId } from "mongodb";

export type AttendanceStatus = "มาเรียน" | "มาสาย" | "ลา" | "ขาด";

export type AttendanceSummaryStatus =
  | AttendanceStatus
  | "ยังไม่เช็คชื่อ";
export interface StudentAttendance {
  studentId: string;
  name: string;
  email: string;
  attendanceDate: string | null;
  section: string;
  major: string;
  status: AttendanceSummaryStatus;
  score: number;
  checkInTime: string | null;
  totalScore: number;
  days: number;
  absentDays: number;
  lateDays: number;
  averageScore: number;
}
export interface AttendanceDocument {
  _id?: ObjectId;
  sessionId: ObjectId | string;
  classId: ObjectId | string;
  className: string;
  studentId: string;
  name: string;
  section: string;
  email?: string;
  academicYear: number;
  date: string;
  checkInTime: Date;
  checkInHour: string;
  status: AttendanceStatus;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}
export interface AttendanceAggregate {
  _id: string;
  totalScore: number;
  days: number;
  lateDays: number;
  lastStatus?: AttendanceStatus;
  lastAttendanceDate?: string;
  lastCheckInTime?: Date;
  lastCheckInHour?: string;
}
export interface CheckInRequestBody {
  classId: string;
  sessionId: string;
  studentId: string;
  name?: string;
  section?: string;
  email?: string;
}
export interface AttendanceResult {
  success: boolean;
  message?: string;
  status?: AttendanceStatus;
  score?: number;
}
export interface AttendanceResponse {
  success: boolean;
  message: string;
  data?: {
    studentId: string;
    sessionId: string;
    sessionDate: string;
    checkInTime: Date;
    status: AttendanceStatus;
    score: number;
  };
}
export interface AttendanceLog {
  date?: string;
  timeText: string;
  status?: string;
  score?: number;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
}
export interface AttendanceSubject {
  id: string;
  name: string;
}
export interface AttendanceClassOption {
  _id: string;
  className?: string;
  classCode?: string;
  classCodes?: string[];
  name?: string;
  title?: string;
  isOpen?: boolean;
  hasStudents?: boolean;
  academicYear?: number;
}