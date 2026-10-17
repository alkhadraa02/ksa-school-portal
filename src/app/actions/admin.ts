"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { splitInstallments, invoiceNumber } from "@/lib/fees";
import { findConflicts, generateTimetable } from "@/lib/timetable";
import { className, DAYS } from "@/lib/constants";
import {
  announcementSchema,
  applicationStatusSchema,
  assignmentSchema,
  classSchema,
  feePlanSchema,
  fieldErrors,
  paymentSchema,
  slotSchema,
  studentSchema,
  subjectSchema,
  teacherSchema,
} from "@/lib/validation";
import type { ZodError } from "zod";
import type { Prisma } from "@prisma/client";

function go(path: string, key: "ok" | "error", message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${key}=${encodeURIComponent(message)}`);
}
const firstError = (e: ZodError) => Object.values(fieldErrors(e))[0] ?? "بيانات غير صحيحة";
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

// ---------- Students ----------
export async function createStudentAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/students";
  const p = studentSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  const count = await db.student.count();
  const studentNo = `S${new Date().getFullYear()}${String(count + 1).padStart(5, "0")}`;
  try {
    await db.student.create({
      data: {
        studentNo,
        name: p.data.name,
        gender: p.data.gender,
        birthDate: new Date(`${p.data.birthDate}T00:00:00Z`),
        classId: p.data.classId ?? null,
        parentId: p.data.parentId ?? null,
      },
    });
  } catch {
    go(back, "error", "تعذّر حفظ الطالب، حاول مرة أخرى");
  }
  revalidatePath(back);
  go(back, "ok", "تمت إضافة الطالب");
}

export async function updateStudentAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/students";
  const id = str(fd, "id");
  const classId = str(fd, "classId");
  const status = str(fd, "status");
  if (!["ACTIVE", "WITHDRAWN", "GRADUATED"].includes(status)) go(back, "error", "حالة غير صحيحة");
  await db.student.update({ where: { id }, data: { classId: classId || null, status } });
  revalidatePath(back);
  go(back, "ok", "تم تحديث الطالب");
}

// ---------- Classes & subjects ----------
export async function createClassAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/classes";
  const p = classSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  const v = p.data;
  const exists = await db.classGroup.findUnique({
    where: { stage_level_section_year: { stage: v.stage, level: v.level, section: v.section, year: v.year } },
  });
  if (exists) go(back, "error", "هذه الشعبة موجودة مسبقاً");
  await db.classGroup.create({ data: { ...v, name: className(v.stage, v.level, v.section) } });
  revalidatePath(back);
  go(back, "ok", "تمت إضافة الشعبة");
}

export async function createSubjectAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/subjects";
  const p = subjectSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  const dup = await db.subject.findFirst({ where: { OR: [{ name: p.data.name }, { code: p.data.code }] } });
  if (dup) go(back, "error", "اسم المادة أو رمزها مستخدم مسبقاً");
  await db.subject.create({ data: p.data });
  revalidatePath(back);
  go(back, "ok", "تمت إضافة المادة");
}

// ---------- Teachers & assignments ----------
export async function createTeacherAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/teachers";
  const p = teacherSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  const v = p.data;
  if (await db.user.findUnique({ where: { email: v.email } })) go(back, "error", "البريد الإلكتروني مستخدم مسبقاً");
  await db.user.create({
    data: {
      email: v.email,
      name: v.name,
      phone: v.phone ?? null,
      role: "TEACHER",
      passwordHash: hashPassword(v.password),
      teacher: { create: { specialty: v.specialty } },
    },
  });
  revalidatePath(back);
  go(back, "ok", "تمت إضافة المعلم");
}

export async function createAssignmentAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/teachers";
  const p = assignmentSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  const v = p.data;
  const existing = await db.teachingAssignment.findUnique({
    where: { classId_subjectId: { classId: v.classId, subjectId: v.subjectId } },
  });
  if (existing) {
    await db.teachingAssignment.update({
      where: { id: existing.id },
      data: { teacherId: v.teacherId, periodsPerWeek: v.periodsPerWeek },
    });
  } else {
    await db.teachingAssignment.create({ data: v });
  }
  revalidatePath(back);
  go(back, "ok", "تم حفظ إسناد المادة");
}

// ---------- Timetable ----------
export async function addSlotAction(fd: FormData) {
  await assertRole("ADMIN");
  const p = slotSchema.safeParse(Object.fromEntries(fd));
  const classId = str(fd, "classId");
  const back = `/admin/timetable?class=${encodeURIComponent(classId)}`;
  if (!p.success) go(back, "error", firstError(p.error));
  const v = p.data;
  const assignment = await db.teachingAssignment.findUnique({ where: { id: v.assignmentId } });
  if (!assignment || assignment.classId !== v.classId) go(back, "error", "الإسناد لا يتبع هذا الفصل");

  const sameCell = await db.timetableSlot.findMany({
    where: { day: v.day, period: v.period },
    include: { class: true, teacher: { include: { user: true } } },
  });
  const candidate = {
    classId: v.classId,
    day: v.day,
    period: v.period,
    subjectId: assignment.subjectId,
    teacherId: assignment.teacherId,
  };
  const conflicts = findConflicts(sameCell, candidate);
  if (conflicts.length > 0) {
    const c = conflicts[0];
    const row = sameCell.find((s) => s.id === c.with.id);
    go(
      back,
      "error",
      c.kind === "CLASS"
        ? `تعارض: الفصل لديه حصة أخرى في ${DAYS[v.day]} الحصة ${v.period}`
        : `تعارض: المعلم ${row?.teacher.user.name ?? ""} يدرّس ${row?.class.name ?? "فصلاً آخر"} في ${DAYS[v.day]} الحصة ${v.period}`,
    );
  }
  await db.timetableSlot.create({ data: candidate });
  revalidatePath("/admin/timetable");
  go(back, "ok", "تمت إضافة الحصة");
}

export async function removeSlotAction(fd: FormData) {
  await assertRole("ADMIN");
  const id = str(fd, "id");
  const classId = str(fd, "classId");
  await db.timetableSlot.deleteMany({ where: { id } });
  revalidatePath("/admin/timetable");
  go(`/admin/timetable?class=${encodeURIComponent(classId)}`, "ok", "تم حذف الحصة");
}

export async function generateTimetableAction(fd: FormData) {
  await assertRole("ADMIN");
  const classId = str(fd, "classId");
  const back = `/admin/timetable?class=${encodeURIComponent(classId)}`;
  const assignments = await db.teachingAssignment.findMany({ where: { classId } });
  if (assignments.length === 0) go(back, "error", "لا توجد مواد مُسنَدة لهذا الفصل");

  const others = await db.timetableSlot.findMany({ where: { classId: { not: classId } } });
  const result = generateTimetable(
    assignments.map((a) => ({
      classId: a.classId,
      subjectId: a.subjectId,
      teacherId: a.teacherId,
      periods: a.periodsPerWeek,
    })),
    { existing: others },
  );
  await db.$transaction([
    db.timetableSlot.deleteMany({ where: { classId } }),
    ...result.slots.map((s) =>
      db.timetableSlot.create({
        data: { classId: s.classId, day: s.day, period: s.period, subjectId: s.subjectId, teacherId: s.teacherId },
      }),
    ),
  ]);
  revalidatePath("/admin/timetable");
  const missing = result.unplaced.reduce((n, u) => n + u.missing, 0);
  if (missing > 0) go(back, "error", `تم توليد ${result.slots.length} حصة وتعذّر وضع ${missing} حصة بسبب ازدحام المعلمين`);
  go(back, "ok", `تم توليد ${result.slots.length} حصة بلا تعارض`);
}

// ---------- Admissions ----------
export async function reviewApplicationAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/admissions";
  const p = applicationStatusSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  await db.application.update({
    where: { id: p.data.id },
    data: { status: p.data.status, adminNote: p.data.adminNote ?? null },
  });
  revalidatePath(back);
  go(back, "ok", "تم تحديث حالة الطلب");
}

// ---------- Fees ----------
export async function createFeePlanAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/fees";
  const p = feePlanSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  await db.feePlan.create({ data: { ...p.data, description: p.data.description ?? null } });
  revalidatePath(back);
  go(back, "ok", "تمت إضافة خطة الرسوم");
}

export async function generateInvoicesAction(fd: FormData) {
  await assertRole("ADMIN");
  const back = "/admin/fees";
  const plan = await db.feePlan.findUnique({ where: { id: str(fd, "planId") } });
  if (!plan) go(back, "error", "الخطة غير موجودة");

  const students = await db.student.findMany({
    where: { status: "ACTIVE", class: { stage: plan.stage } },
    select: { id: true },
  });
  const already = new Set(
    (await db.invoice.findMany({ where: { feePlanId: plan.id }, select: { studentId: true } })).map((i) => i.studentId),
  );
  const targets = students.filter((s) => !already.has(s.id));
  if (targets.length === 0) go(back, "error", "لا يوجد طلاب جدد لإصدار فواتير لهم");

  const last = await db.invoice.findFirst({ orderBy: { number: "desc" }, select: { number: true } });
  let seq = last ? Number(last.number.split("-").pop()) || 0 : 0;
  const year = new Date().getFullYear();
  const parts = splitInstallments(plan.amount, plan.installments);
  const step = Math.max(1, Math.floor(9 / plan.installments));
  const data: Prisma.InvoiceCreateManyInput[] = [];
  for (const s of targets) {
    parts.forEach((amount, i) => {
      seq += 1;
      data.push({
        number: invoiceNumber(year, seq),
        studentId: s.id,
        feePlanId: plan.id,
        title: parts.length > 1 ? `${plan.name} — دفعة ${i + 1} من ${parts.length}` : plan.name,
        amount,
        dueDate: new Date(Date.UTC(year, 8 + i * step, 1)),
      });
    });
  }
  await db.invoice.createMany({ data });
  revalidatePath(back);
  go(back, "ok", `تم إصدار ${data.length} فاتورة لـ ${targets.length} طالباً`);
}

export async function recordPaymentAction(fd: FormData) {
  const user = await assertRole("ADMIN");
  const back = "/admin/fees";
  const p = paymentSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  const invoice = await db.invoice.findUnique({ where: { id: p.data.invoiceId }, include: { payments: true } });
  if (!invoice) go(back, "error", "الفاتورة غير موجودة");
  const remaining = invoice.amount - invoice.payments.reduce((s, x) => s + x.amount, 0);
  if (p.data.amount > remaining) go(back, "error", `المبلغ أكبر من المتبقي على الفاتورة (${remaining} ر.س)`);
  await db.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: p.data.amount,
      method: p.data.method,
      reference: p.data.reference ?? null,
      recordedById: user.id,
    },
  });
  revalidatePath(back);
  go(back, "ok", "تم تسجيل الدفعة");
}

// ---------- Announcements ----------
export async function createAnnouncementAction(fd: FormData) {
  const user = await assertRole("ADMIN");
  const back = "/admin/announcements";
  const p = announcementSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) go(back, "error", firstError(p.error));
  await db.announcement.create({ data: { ...p.data, authorId: user.id } });
  revalidatePath(back);
  revalidatePath("/parent");
  revalidatePath("/teacher");
  go(back, "ok", "تم نشر الإعلان");
}

export async function deleteAnnouncementAction(fd: FormData) {
  await assertRole("ADMIN");
  await db.announcement.deleteMany({ where: { id: str(fd, "id") } });
  revalidatePath("/admin/announcements");
  go("/admin/announcements", "ok", "تم حذف الإعلان");
}
