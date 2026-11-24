"use client";

import { Upload } from "lucide-react";
import { useLanguage } from "@/lib/language";
import type { CheckInConfigFields } from "@/types/check-in";

interface ConfigFieldProps {
  field: keyof CheckInConfigFields;
  enabled: boolean;
  onToggle: (field: keyof CheckInConfigFields) => void;
}

const fieldLabels: Record<keyof CheckInConfigFields, string> = {
  prefix: "คำนำหน้า / Prefix",
  firstname: "ชื่อ / First name",
  lastname: "นามสกุล / Last name",
  studentId: "รหัสนักศึกษา / Student ID",
  email: "อีเมล / Email",
  section: "เซคชั่น / Section",
  photo: "รูปภาพ / Photo",
  note: "หมายเหตุ / Note",
  location: "สถานที่ / Location",
};

const fieldPlaceholders: Record<keyof CheckInConfigFields, string> = {
  prefix: "นาย / นางสาว",
  firstname: "กรอกชื่อ",
  lastname: "กรอกนามสกุล",
  studentId: "กรอกรหัสนักศึกษา",
  email: "example@email.com",
  section: "เช่น 1",
  photo: "อัปโหลดรูปภาพ",
  note: "กรอกหมายเหตุเพิ่มเติม",
  location: "กรอกสถานที่",
};

export default function ConfigField({
  field,
  enabled,
  onToggle,
}: ConfigFieldProps) {
  const { tr } = useLanguage();

  const renderToggle = () => (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={tr(fieldLabels[field])}
      onClick={() => onToggle(field)}
      className={`flex h-4 w-8 cursor-pointer items-center rounded-full px-0.5 transition lg:h-5 lg:w-10 lg:px-1 ${
        enabled ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <div
        className={`h-3 w-3 transform rounded-full bg-white shadow-sm transition duration-200 lg:h-3.5 lg:w-3.5 ${
          enabled ? "translate-x-4 lg:translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs text-gray-800 lg:text-base">
          {tr(fieldLabels[field])}
        </label>

        {renderToggle()}
      </div>

      {field === "note" ? (
        <textarea
          disabled
          placeholder={tr(fieldPlaceholders[field])}
          rows={3}
          className="w-full resize-none rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 text-xs text-gray-400 placeholder:text-xs lg:px-3 lg:text-sm lg:placeholder:text-sm"
        />
      ) : field === "photo" ? (
        <div className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-7 text-center lg:py-10">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-500 lg:h-12 lg:w-12">
            <Upload className="h-5 w-5 text-blue-500 lg:h-6 lg:w-6" />
          </div>

          <p className="mb-1 text-xs text-gray-600 lg:text-sm">
            {tr("เลือกรูปภาพ หรือ ลากและวางรูปภาพที่นี่")}
          </p>

          <p className="mb-4 text-[10px] text-gray-400 lg:text-xs">
            {tr("ไฟล์ต้องมีขนาดไม่เกิน 10 MB")}
          </p>

          <button
            type="button"
            disabled
            className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-500 lg:px-4 lg:text-sm"
          >
            <Upload className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            {tr("อัปโหลดรูปภาพ")}
          </button>
        </div>
      ) : (
        <input
          type="text"
          disabled
          placeholder={tr(fieldPlaceholders[field])}
          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2.5 py-2 text-xs text-gray-400 placeholder:text-[10px] lg:px-3 lg:text-sm lg:placeholder:text-sm"
        />
      )}
    </div>
  );
}
