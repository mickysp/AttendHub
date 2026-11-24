"use client";

import { useLanguage } from "@/lib/language";
import type { CheckInConfigFields } from "@/types/check-in";
import ConfigField from "./ConfigField";
import type { ReactNode } from "react";

import {
  ClipboardDocumentListIcon,
  IdentificationIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

interface CheckInFieldsProps {
  config: CheckInConfigFields;
  disabled: boolean;
  configReady: boolean;
  usesDefault: boolean;
  selectedClassId: string;
  classesLoading: boolean;
  configLoading: boolean;
  loadError: string;
  onToggle: (field: keyof CheckInConfigFields) => void;
  onRetry: () => void;
  actions: ReactNode;
}

export default function CheckInFields({
  config,
  disabled,
  configReady,
  usesDefault,
  selectedClassId,
  classesLoading,
  configLoading,
  loadError,
  onToggle,
  onRetry,
  actions,
}: CheckInFieldsProps) {
  const { tr } = useLanguage();

  const renderField = (field: keyof CheckInConfigFields) => (
    <ConfigField
      key={field}
      field={field}
      enabled={config[field]}
      onToggle={onToggle}
    />
  );

  const renderGroupHeading = (
    icon: ReactNode,
    title: string,
    description: string,
  ) => (
    <div className="mb-4 flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700">{tr(title)}</h3>
        <p className="mt-0.5 text-xs text-slate-400">{tr(description)}</p>
      </div>
    </div>
  );

  return (
    <section
      aria-labelledby="fields-section-heading"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <ClipboardDocumentListIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="fields-section-heading"
              className="text-base font-semibold text-slate-800"
            >
              {tr("ตัวอย่างแบบฟอร์มเช็คชื่อ")}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {tr("เลือกช่องที่ต้องการให้นักศึกษากรอกเมื่อเช็คชื่อ")}
            </p>

            {configReady && (
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
                    usesDefault
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      usesDefault ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                  {usesDefault
                    ? tr("ใช้ค่าเริ่มต้น · บันทึกเพื่อกำหนดค่าเฉพาะวิชา")
                    : tr("กำลังใช้การตั้งค่าเฉพาะวิชา")}
                </span>
              </div>
            )}

            {!selectedClassId && !classesLoading && (
              <p className="mt-3 text-xs text-slate-500">
                {tr("เลือกรายวิชาเพื่อเริ่มตั้งค่า")}
              </p>
            )}

            {loadError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {tr(loadError)}{" "}
                <button
                  type="button"
                  onClick={onRetry}
                  className="font-medium underline underline-offset-2 hover:text-red-700"
                >
                  {tr("ลองอีกครั้ง")}
                </button>
              </p>
            )}

            {configLoading && (
              <p role="status" className="mt-3 text-xs text-slate-500">
                {tr("กำลังโหลดการตั้งค่ารายวิชา...")}
              </p>
            )}
          </div>
        </div>
      </div>

      <fieldset
        disabled={disabled}
        className={`min-w-0 space-y-6 p-5 transition-opacity sm:p-6 ${
          disabled ? "opacity-50" : ""
        }`}
      >
        <div>
          {renderGroupHeading(
            <UserIcon className="h-4 w-4" />,
            "ข้อมูลส่วนบุคคล",
            "ข้อมูลพื้นฐานของนักศึกษา",
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {renderField("prefix")}
            {renderField("firstname")}
            {renderField("lastname")}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div>
          {renderGroupHeading(
            <IdentificationIcon className="h-4 w-4" />,
            "ข้อมูลนักศึกษา",
            "ข้อมูลสำหรับระบุตัวตนและกลุ่มเรียน",
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderField("studentId")}
            {renderField("section")}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        <div>
          {renderGroupHeading(
            <ChatBubbleLeftRightIcon className="h-4 w-4" />,
            "ข้อมูลเพิ่มเติม",
            "ข้อมูลติดต่อและรายละเอียดประกอบการเช็คชื่อ",
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {renderField("email")}
            {renderField("location")}
          </div>

          <div className="mt-4">{renderField("note")}</div>

          <div className="mt-4">{renderField("photo")}</div>
        </div>
      </fieldset>

      <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
        {actions}
      </div>
    </section>
  );
}
