import type { ObjectId } from "mongodb";

import type {
  AttendanceStatus,
  AttendanceSummaryStatus,
} from "@/types/attendance";

export interface CheckInLog {
  date: string;
  time?: Date | string;
  timeText: string;
  status: AttendanceSummaryStatus;
  score?: number;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface AttendanceLogDocument {
  _id?: ObjectId;
  sessionId?: ObjectId | string;
  classId: ObjectId | string;
  studentId: string;
  status: AttendanceStatus;
  score?: number;
  academicYear: number;
  date: string;
  checkInHour?: string;
  createdAt?: Date;
  logs?: CheckInLog[];
}