
"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language";

import { checkInApi } from "@/services/api/check-in";
import { classesApi } from "@/services/api/classes";

import type { ClassResponse } from "@/types/classes";
import {
  defaultCheckInConfig,
  type CheckInConfigFields,
} from "@/types/check-in";

import { useConfirm } from "@/context/swal";
import { useAlert } from "@/context/AlertContext";

import ClassSelector from "@/components/configform/ClassSelector";
import CheckInFields from "@/components/configform/CheckInFields";
import ConfigActions from "@/components/configform/ConfigActions";

export default function CheckInFormPage() {
  const { tr } = useLanguage();
  const { showAlert } = useAlert();
  const { showConfirm } = useConfirm();
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [loadedClassId, setLoadedClassId] = useState("");
  const [classesLoading, setClassesLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [usesDefault, setUsesDefault] = useState(true);
  const [config, setConfig] = useState<CheckInConfigFields>({
    ...defaultCheckInConfig,
  });

  const [initialConfig, setInitialConfig] =
    useState<CheckInConfigFields>({
      ...defaultCheckInConfig,
    });

  const selectedClass = classes.find(
    (subject) => subject._id === selectedClassId,
  );

  const isDirty =
    JSON.stringify(config) !== JSON.stringify(initialConfig);

  const configReady =
    Boolean(selectedClassId) &&
    loadedClassId === selectedClassId &&
    !configLoading &&
    !loadError;

  const canSave =
    configReady && !saving && (isDirty || usesDefault);

  const isLoading =
    classesLoading ||
    (Boolean(selectedClassId) && configLoading);

  useEffect(() => {
    const controller = new AbortController();

    const loadClasses = async () => {
      setClassesLoading(true);
      setLoadError("");

      try {
        const res = await classesApi.list(
          {},
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const data = await res.json();

        if (
          !res.ok ||
          !data.success ||
          !Array.isArray(data.data)
        ) {
          throw new Error("โหลดรายวิชาไม่สำเร็จ");
        }

        if (!controller.signal.aborted) {
          setClasses(data.data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadError(
            "โหลดรายวิชาไม่สำเร็จ กรุณาลองอีกครั้ง",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setClassesLoading(false);
        }
      }
    };

    void loadClasses();

    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (!selectedClassId) return;

    const controller = new AbortController();

    const fetchConfig = async () => {
      setConfigLoading(true);
      setLoadedClassId("");
      setLoadError("");

      try {
        const res = await checkInApi.getConfig(
          selectedClassId,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!res.ok) {
          throw new Error("โหลดไม่สำเร็จ");
        }

        const data = await res.json();

        if (!data.success || !data.config) {
          throw new Error("โหลดไม่สำเร็จ");
        }

        if (!controller.signal.aborted) {
          setConfig(data.config);
          setInitialConfig(data.config);
          setUsesDefault(data.source !== "class");
          setLoadedClassId(selectedClassId);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLoadError(
            "โหลดการตั้งค่าไม่สำเร็จ กรุณาลองอีกครั้ง",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setConfigLoading(false);
        }
      }
    };

    void fetchConfig();

    return () => controller.abort();
  }, [selectedClassId, retry]);

  const handleSelectClass = (id: string) => {
    if (id === selectedClassId) return;

    if (isDirty && configReady) {
      showConfirm(
        "เปลี่ยนรายวิชา?",
        () => setSelectedClassId(id),
        "warning",
        "การแก้ไขที่ยังไม่ได้บันทึกจะถูกยกเลิก",
      );
    } else {
      setSelectedClassId(id);
    }
  };

  const handleToggleField = (
    field: keyof CheckInConfigFields,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSaveConfig = async () => {
    if (!canSave) return;

    try {
      setSaving(true);

      const res = await checkInApi.updateConfig({
        classId: selectedClassId,
        config,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error("บันทึกไม่สำเร็จ");
      }

      setInitialConfig({ ...config });
      setUsesDefault(false);

      showAlert(
        "บันทึกการตั้งค่าของรายวิชานี้แล้ว",
        "success",
      );
    } catch {
      showAlert(
        "เกิดข้อผิดพลาดในการบันทึก",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = () => {
    if (!canSave) return;

    showConfirm(
      "บันทึกแก้ไขข้อมูล",
      handleSaveConfig,
      "info",
      `บันทึกการตั้งค่าสำหรับ ${
        selectedClass?.className || "รายวิชาที่เลือก"
      } ใช่หรือไม่`,
    );
  };

  const handleCancel = () => {
    if (!configReady || saving) return;

    showConfirm(
      "ยกเลิกการแก้ไขข้อมูล",
      () => setConfig({ ...initialConfig }),
      "edit",
      "คุณต้องการยกเลิกการแก้ไขข้อมูลใช่หรือไม่",
    );
  };

  const handleRetry = () => {
    setRetry((value) => value + 1);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-blue-50">
      <main className="relative min-h-0 flex-1 overflow-y-auto p-6 pt-[80px] font-noto lg:pt-6">

        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-300/80 backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white border-t-transparent" />

              <p className="text-base text-white">
                {tr("กำลังโหลด...")}
              </p>
            </div>
          </div>
        )}

        <div className="w-full space-y-5 rounded-2xl bg-white p-6 lg:p-8">

          <header className="mb-7">
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
              {tr("ตั้งค่าแบบฟอร์มเช็คชื่อ")}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {tr(
                "เลือกรายวิชา แล้วเปิด–ปิดช่องข้อมูลที่ต้องการให้นักศึกษากรอก การตั้งค่าจะมีผลเฉพาะวิชาที่เลือก",
              )}
            </p>
          </header>

          <ClassSelector
            classes={classes}
            selectedClassId={selectedClassId}
            loading={classesLoading}
            disabled={saving}
            onSelect={handleSelectClass}
          />

          <CheckInFields
            config={config}
            disabled={!configReady || saving}
            configReady={configReady}
            usesDefault={usesDefault}
            selectedClassId={selectedClassId}
            classesLoading={classesLoading}
            configLoading={configLoading}
            loadError={loadError}
            onToggle={handleToggleField}
            onRetry={handleRetry}
            actions={
              <ConfigActions
                saving={saving}
                canSave={canSave}
                disabled={!configReady || saving}
                onSave={handleConfirmSave}
                onCancel={handleCancel}
              />
            }
          />
        </div>
      </main>
    </div>
  );
}
