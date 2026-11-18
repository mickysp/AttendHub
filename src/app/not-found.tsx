"use client";

import { useLanguage } from "@/lib/language";

export default function NotFound() {
  const { tr } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12 font-noto">
      <div className="w-full max-w-xl text-center">
        <div className="relative mx-auto mb-8 flex h-52 w-52 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-blue-100/70 blur-2xl" />

          <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-blue-100 bg-white shadow-xl shadow-blue-100/50">
            <span className="text-7xl font-extrabold tracking-tight text-[var(--primary)]">
              404
            </span>
          </div>

          <div className="absolute right-0 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-7 w-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0 3h.008M10.29 3.86 1.82 18.5a1.5 1.5 0 0 0 1.3 2.25h16.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.98 1.98 0 0 0-3.42 0Z"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {tr("ไม่พบหน้าที่คุณกำลังค้นหา")}
          </h1>

          <p className="mx-auto max-w-md text-sm leading-7 text-gray-500 sm:text-base">
            {tr("ขออภัย ไม่พบหน้าที่คุณต้องการ กรุณาตรวจสอบอีกครั้ง")}
          </p>
        </div>

        <p className="mt-12 text-xs text-gray-400">
          Error Code: 404 | Page Not Found
        </p>
      </div>
    </main>
  );
}
