"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/auth";
import { assessmentSchema, attendanceSchema, fieldErrors, homeworkSchema } from "@/lib/validation";
import { isSchoolDay, todayISO } from "@/lib/format";
import { teacherContext } from "@/lib/portal";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
function done(path: string, message: string): never {
  redirect(`${path}?ok=${encodeURIComponent(message)}`);
}

async function requireTeacher() {
  const user = await assertRole("TEACHER");
  const ctx = await teacherContext(user.id);
  if (!ctx) throw new Error("لا يوجد ملف معلم لهذا الحساب");
  return { user, ...ctx };
}

export async function saveAttendanceAction(formData: FormData) {
  const { assignments, user } = await requireTeacher();
  const classId = String(formData.get("classId") ?? "");
  const date = String(formData.get("date") ?? "");
  const back = `/teacher/attendance`;
  const q = `${back}?class=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`;

  if (!assignments.some((a) => a.classId === classId)) fail(back, "هذا الفصل ليس ضمن فصولك");
  if (!isSchoolDay(date)) fail(q, "التاريخ ليس يوم دراسة");
  if (date > todayISO()) fail(q, "لا يمكن تسجيل حضور لتاريخ مستقبلي");

  const students = await db.student.findMany({ where: { classId, status: "ACTIVE" }, select: { id: true } });
  const entries = students.map((s) => ({
    studentId: s.id,
    status: String(formData.get(`status_${s.id}`) ?? "PRESENT"),
    note: String(formData.get(`note_${s.id}`) ?? ""),
  }));
  const parsed = attendanceSchema.safeParse({ classId, date, entries });
  if (!parsed.success) fail(q, Object.values(fieldErrors(parsed.error))[0] ?? "بيانات غير صحيحة");

  await db.$transaction(
    parsed.data.entries.map((e) =>
      db.attendance.upsert({
        where: { studentId_date: { studentId: e.studentId, date } },
        update: { status: e.status, note: e.note ?? null, recordedById: user.id },
        create: { studentId: e.studentId, date, status: e.status, note: e.note ?? null, recordedById: user.id },
      }),
    ),
  );
  revalidatePath("/teacher/attendance");
  done(q, "تم حفظ الحضور");
}

export async function createAssessmentAction(formData: FormData) {
  const { assignments, teacher } = await requireTeacher();
  const back = "/teacher/grades";
  const [classId = "", subjectId = ""] = String(formData.get("pair") ?? "").split("|");
  const parsed = assessmentSchema.safeParse({ ...Object.fromEntries(formData), classId, subjectId });
  if (!parsed.success) fail(back, Object.values(fieldErrors(parsed.error))[0] ?? "بيانات غير صحيحة");
  const v = parsed.data;
  if (!assignments.some((a) => a.classId === v.classId && a.subjectId === v.subjectId)) {
    fail(back, "لا تدرّس هذه المادة لهذا الفصل");
  }
  const created = await db.assessment.create({
    data: { classId: v.classId, subjectId: v.subjectId, teacherId: teacher.id, title: v.title, term: v.term, maxScore: v.maxScore },
  });
  revalidatePath(back);
  done(`${back}/${created.id}`, "تم إنشاء التقييم، أدخل الدرجات");
}

export async function saveScoresAction(formData: FormData) {
  const { teacher } = await requireTeacher();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const path = `/teacher/grades/${assessmentId}`;
  const assessment = await db.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment || assessment.teacherId !== teacher.id) fail("/teacher/grades", "التقييم غير موجود");

  const students = await db.student.findMany({ where: { classId: assessment.classId, status: "ACTIVE" }, select: { id: true } });
  const writes = [];
  const clears: string[] = [];
  for (const s of students) {
    const raw = String(formData.get(`score_${s.id}`) ?? "").trim();
    if (raw === "") {
      clears.push(s.id);
      continue;
    }
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0 || score > assessment.maxScore) {
      fail(path, `الدرجة يجب أن تكون بين 0 و${assessment.maxScore}`);
    }
    writes.push(
      db.grade.upsert({
        where: { assessmentId_studentId: { assessmentId, studentId: s.id } },
        update: { score },
        create: { assessmentId, studentId: s.id, score },
      }),
    );
  }
  await db.$transaction([
    ...writes,
    db.grade.deleteMany({ where: { assessmentId, studentId: { in: clears } } }),
  ]);
  revalidatePath(path);
  done(path, "تم حفظ الدرجات");
}

export async function createHomeworkAction(formData: FormData) {
  const { assignments, teacher } = await requireTeacher();
  const back = "/teacher/homework";
  const [classId = "", subjectId = ""] = String(formData.get("pair") ?? "").split("|");
  const parsed = homeworkSchema.safeParse({ ...Object.fromEntries(formData), classId, subjectId });
  if (!parsed.success) fail(back, Object.values(fieldErrors(parsed.error))[0] ?? "بيانات غير صحيحة");
  const v = parsed.data;
  if (!assignments.some((a) => a.classId === v.classId && a.subjectId === v.subjectId)) {
    fail(back, "لا تدرّس هذه المادة لهذا الفصل");
  }
  await db.homework.create({ data: { ...v, teacherId: teacher.id } });
  revalidatePath(back);
  done(back, "تم نشر الواجب");
}

export async function deleteHomeworkAction(formData: FormData) {
  const { teacher } = await requireTeacher();
  const id = String(formData.get("id") ?? "");
  await db.homework.deleteMany({ where: { id, teacherId: teacher.id } });
  revalidatePath("/teacher/homework");
  done("/teacher/homework", "تم حذف الواجب");
}
