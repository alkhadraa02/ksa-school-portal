import { z } from "zod";
import {
  ATTENDANCE_STATUSES,
  APPLICATION_STATUSES,
  PAYMENT_METHODS,
  STAGE_KEYS,
  maxLevel,
  DAYS,
  PERIODS_PER_DAY,
} from "./constants";
import { normalizePhone } from "./format";

export type FieldErrors = Record<string, string>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

const req = (label: string) => `الرجاء إدخال ${label}`;
const text = (label: string, min = 2, max = 120) =>
  z
    .string({ error: req(label) })
    .trim()
    .min(min, req(label))
    .max(max, `${label} طويل جداً`);
const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, "النص طويل جداً")
    .optional()
    .transform((v) => (v ? v : undefined));

const isoDate = z
  .string({ error: "الرجاء إدخال تاريخ صحيح" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "الرجاء إدخال تاريخ صحيح")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "الرجاء إدخال تاريخ صحيح");

export const saudiPhone = z
  .string({ error: req("رقم الجوال") })
  .trim()
  .refine((v) => normalizePhone(v) !== null, "رقم الجوال غير صحيح (مثال: 0501234567)")
  .transform((v) => normalizePhone(v) as string);

export const loginSchema = z.object({
  email: z.string({ error: req("البريد الإلكتروني") }).trim().toLowerCase().pipe(z.email("البريد الإلكتروني غير صحيح")),
  password: z.string({ error: req("كلمة المرور") }).min(1, req("كلمة المرور")).max(200),
});

export const applicationSchema = z
  .object({
    studentName: text("اسم الطالب", 3, 80),
    birthDate: isoDate,
    gender: z.enum(["M", "F"], { error: "اختر الجنس" }),
    stage: z.enum(STAGE_KEYS, { error: "اختر المرحلة" }),
    level: z.coerce.number({ error: "اختر الصف" }).int().min(1, "اختر الصف"),
    guardianName: text("اسم ولي الأمر", 3, 80),
    phone: saudiPhone,
    email: z
      .string()
      .trim()
      .toLowerCase()
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.email("البريد الإلكتروني غير صحيح").optional()),
    previousSchool: optionalText(120),
    notes: optionalText(600),
  })
  .superRefine((v, ctx) => {
    if (v.level > maxLevel(v.stage)) {
      ctx.addIssue({ code: "custom", path: ["level"], message: "الصف لا يتبع المرحلة المختارة" });
    }
    const born = new Date(`${v.birthDate}T00:00:00Z`);
    const years = (Date.now() - born.getTime()) / (365.25 * 24 * 3600 * 1000);
    if (years < 2.5 || years > 20) {
      ctx.addIssue({ code: "custom", path: ["birthDate"], message: "تاريخ الميلاد غير منطقي لهذه المراحل" });
    }
  });

export const statusLookupSchema = z.object({
  reference: text("رقم الطلب", 6, 30).transform((v) => v.toUpperCase()),
  phone: saudiPhone,
});

export const contactSchema = z.object({
  name: text("الاسم", 2, 80),
  email: z.string({ error: req("البريد الإلكتروني") }).trim().toLowerCase().pipe(z.email("البريد الإلكتروني غير صحيح")),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || normalizePhone(v) !== null, "رقم الجوال غير صحيح"),
  message: text("الرسالة", 10, 1500),
});

export const applicationStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(APPLICATION_STATUSES),
  adminNote: optionalText(500),
});

export const attendanceEntrySchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(ATTENDANCE_STATUSES),
  note: optionalText(200),
});

export const attendanceSchema = z.object({
  classId: z.string().min(1),
  date: isoDate,
  entries: z.array(attendanceEntrySchema).min(1, "لا يوجد طلاب"),
});

export const assessmentSchema = z.object({
  classId: z.string().min(1, "اختر الفصل"),
  subjectId: z.string().min(1, "اختر المادة"),
  title: text("عنوان التقييم", 2, 80),
  term: z.coerce.number().int().min(1).max(3),
  maxScore: z.coerce.number({ error: "الدرجة العظمى مطلوبة" }).positive("الدرجة العظمى يجب أن تكون أكبر من صفر").max(1000),
});

export const homeworkSchema = z.object({
  classId: z.string().min(1, "اختر الفصل"),
  subjectId: z.string().min(1, "اختر المادة"),
  title: text("عنوان الواجب", 3, 100),
  body: text("وصف الواجب", 5, 1500),
  dueDate: isoDate,
});

export const messageSchema = z.object({
  toId: z.string().min(1, "اختر المستلم"),
  studentId: z.string().optional().transform((v) => (v ? v : undefined)),
  subject: text("الموضوع", 3, 100),
  body: text("نص الرسالة", 2, 2000),
});

export const announcementSchema = z.object({
  title: text("العنوان", 3, 120),
  body: text("نص الإعلان", 5, 2000),
  audience: z.enum(["ALL", "PARENTS", "TEACHERS"]),
});

export const feePlanSchema = z.object({
  name: text("اسم الخطة", 3, 100),
  stage: z.enum(STAGE_KEYS, { error: "اختر المرحلة" }),
  amount: z.coerce.number({ error: "المبلغ مطلوب" }).int().min(100, "المبلغ قليل جداً").max(500000),
  installments: z.coerce.number().int().min(1).max(12),
  year: text("العام الدراسي", 4, 20),
  description: optionalText(300),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number({ error: "المبلغ مطلوب" }).int().positive("المبلغ يجب أن يكون أكبر من صفر"),
  method: z.enum(PAYMENT_METHODS),
  reference: optionalText(80),
});

export const studentSchema = z.object({
  name: text("اسم الطالب", 3, 80),
  gender: z.enum(["M", "F"]),
  birthDate: isoDate,
  classId: z.string().optional().transform((v) => (v ? v : undefined)),
  parentId: z.string().optional().transform((v) => (v ? v : undefined)),
});

export const classSchema = z
  .object({
    stage: z.enum(STAGE_KEYS, { error: "اختر المرحلة" }),
    level: z.coerce.number().int().min(1),
    section: text("الشعبة", 1, 4),
    year: text("العام الدراسي", 4, 20),
    capacity: z.coerce.number().int().min(5).max(60),
  })
  .refine((v) => v.level <= maxLevel(v.stage), { path: ["level"], message: "الصف لا يتبع المرحلة" });

export const subjectSchema = z.object({
  name: text("اسم المادة", 2, 60),
  code: text("رمز المادة", 2, 12).transform((v) => v.toUpperCase()),
});

export const teacherSchema = z.object({
  name: text("اسم المعلم", 3, 80),
  email: z.string({ error: req("البريد الإلكتروني") }).trim().toLowerCase().pipe(z.email("البريد الإلكتروني غير صحيح")),
  phone: z.string().trim().optional().transform((v) => (v ? v : undefined)),
  specialty: text("التخصص", 2, 60),
  password: z.string().min(10, "كلمة المرور 10 أحرف على الأقل").max(200),
});

export const assignmentSchema = z.object({
  classId: z.string().min(1, "اختر الفصل"),
  subjectId: z.string().min(1, "اختر المادة"),
  teacherId: z.string().min(1, "اختر المعلم"),
  periodsPerWeek: z.coerce.number().int().min(1).max(10),
});

export const slotSchema = z.object({
  classId: z.string().min(1),
  day: z.coerce.number().int().min(0).max(DAYS.length - 1),
  period: z.coerce.number().int().min(1).max(PERIODS_PER_DAY),
  assignmentId: z.string().min(1),
});
