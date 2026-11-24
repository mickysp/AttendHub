
"use client";

import { useLanguage } from "@/lib/language";

interface ConfigActionsProps {
  saving: boolean;
  canSave: boolean;
  disabled: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export default function ConfigActions({
  saving,
  canSave,
  disabled,
  onSave,
  onCancel,
}: ConfigActionsProps) {
  const { tr } = useLanguage();

  return (
    <div className="mt-6 w-full">
      <div className="flex w-full flex-col gap-2 text-sm lg:flex-row lg:justify-end lg:gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className={`w-full rounded-lg px-5 py-2.5 text-xs text-white lg:w-auto lg:px-6 lg:text-sm ${
            !canSave
              ? "bg-gray-300"
              : "cursor-pointer bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {saving ? tr("กำลังบันทึก...") : tr("บันทึก")}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="w-full cursor-pointer rounded-md border border-gray-300 px-5 py-2.5 text-xs text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto lg:px-6 lg:text-sm"
        >
          {tr("ยกเลิก")}
        </button>
      </div>
    </div>
  );
}
