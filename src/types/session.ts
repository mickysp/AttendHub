import type { ObjectId } from "mongodb";

export interface SessionDocument {
  _id?: ObjectId;
  classId: ObjectId | string;
  academicYear: number;
  date: string;
  startTime?: string;
  endTime?: string;
  lateAfter?: number;
  allowCheckIn?: boolean;
  isOpen?: boolean;
  className?: string;
  createdAt?: Date;
  updatedAt?: Date;
}