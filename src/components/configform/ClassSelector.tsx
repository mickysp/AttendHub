"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDownIcon,
  BookOpenIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

import { useLanguage } from "@/lib/language";
import type { ClassResponse } from "@/types/classes";

interface ClassSelectorProps {
  classes: ClassResponse[];
  selectedClassId: string;
  loading: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
}

export default function ClassSelector({
  classes,
  selectedClassId,
  loading,
  disabled = false,
  onSelect,
}: ClassSelectorProps) {
  const { tr } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedClass = classes.find(
    (subject) => subject._id === selectedClassId,
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    setIsOpen(false);

    if (id !== selectedClassId) {
      onSelect(id);
    }
  };

  const isDisabled = loading || disabled || classes.length === 0;

  return (
    <section
      aria-labelledby="class-section-heading"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <BookOpenIcon className="h-5 w-5" />
        </div>

        <div>
          <h2
            id="class-section-heading"
            className="text-base font-semibold text-slate-800"
          >
            {tr("เลือกรายวิชา")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {tr("การตั้งค่าจะบันทึกแยกตามรายวิชา")}
          </p>
        </div>
      </div>

      <div ref={dropdownRef} className="relative">
        <label
          id="config-class-label"
          htmlFor="config-class"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {tr("รายวิชา")}
        </label>

        <button
          id="config-class"
          type="button"
          aria-labelledby="config-class-label"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={isDisabled}
          onClick={() => setIsOpen((open) => !open)}
          className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-3 text-left text-sm transition-all
            ${
              isOpen
                ? "border-blue-400 ring-2 ring-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }
            ${
              isDisabled
                ? "cursor-not-allowed bg-slate-50 text-slate-400"
                : "cursor-pointer text-slate-700"
            }`}
        >
          <span className="min-w-0 truncate">
            {selectedClass
              ? `${selectedClass.classCodes.join(", ")} — ${selectedClass.className}`
              : loading
                ? tr("กำลังโหลดรายวิชา...")
                : tr("เลือกรายวิชา")}
          </span>

          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-labelledby="config-class-label"
            className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg shadow-slate-200/50 cursor-pointer focus:outline-none sm:text-sm"
          >
            {classes.map((subject) => {
              const isSelected = subject._id === selectedClassId;

              return (
                <button
                  key={subject._id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(subject._id)}
                  className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {subject.classCodes.join(", ")}
                    </span>

                    <span
                      className={`mt-0.5 block truncate text-xs ${
                        isSelected ? "text-blue-600" : "text-slate-500"
                      }`}
                    >
                      {subject.className}
                    </span>
                  </span>

                  {isSelected && (
                    <CheckIcon className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!loading && classes.length === 0 && (
        <p className="mt-3 text-xs text-slate-500">
          {tr("ยังไม่มีรายวิชา กรุณาเพิ่มรายวิชาก่อนตั้งค่า")}
        </p>
      )}
    </section>
  );
}
