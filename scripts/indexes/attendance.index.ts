import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());

  const { default: clientPromise } = await import(
    "@/lib/mongodb"
  );

  const client = await clientPromise;
  const db = client.db("attendance");

  await db.collection("attendance").createIndex(
    {
      sessionId: 1,
      studentId: 1,
    },
    {
      unique: true,
      name: "unique_student_session_attendance",
    },
  );

  console.log("สร้าง Attendance Unique Index สำเร็จ");

  await client.close();
}

main().catch((error) => {
  console.error("สร้าง Attendance Index ไม่สำเร็จ:", error);
  process.exitCode = 1;
});