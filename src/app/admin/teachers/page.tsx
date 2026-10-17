import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, EmptyState, Field, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { Flash } from "@/components/flash";
import { createAssignmentAction, createTeacherAction } from "@/app/actions/admin";
import type { OneOrMany } from "@/lib/portal";

export const metadata: Metadata = { title: "المعلمون" };

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const [teachers, classes, subjects, assignments] = await Promise.all([
    db.teacher.findMany({ include: { user: true, _count: { select: { assignments: true } } }, orderBy: { user: { name: "asc" } } }),
    db.classGroup.findMany({ orderBy: [{ stage: "asc" }, { level: "asc" }, { section: "asc" }] }),
    db.subject.findMany({ orderBy: { name: "asc" } }),
    db.teachingAssignment.findMany({
      include: { class: true, subject: true, teacher: { include: { user: true } } },
      orderBy: [{ class: { stage: "asc" } }, { class: { level: "asc" } }, { class: { section: "asc" } }],
    }),
  ]);

  return (
    <>
      <PageHeader title="المعلمون" lead="حسابات المعلمين وإسناد المواد والحصص الأسبوعية لكل فصل." />
      <Flash params={params} />

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg font-bold">إضافة معلم</h2>
          <form action={createTeacherAction} className="grid gap-4 sm:grid-cols-2">
            <Field label="الاسم" name="name">
              <input id="name" name="name" required className={inputClass} />
            </Field>
            <Field label="التخصص" name="specialty">
              <input id="specialty" name="specialty" required className={inputClass} />
            </Field>
            <Field label="البريد الإلكتروني" name="email">
              <input id="email" name="email" type="email" required dir="ltr" autoComplete="off" className={inputClass} />
            </Field>
            <Field label="الجوال (اختياري)" name="phone">
              <input id="phone" name="phone" type="tel" dir="ltr" className={inputClass} />
            </Field>
            <Field label="كلمة مرور مبدئية" name="password" hint="10 أحرف على الأقل">
              <input id="password" name="password" type="password" required minLength={10} dir="ltr" autoComplete="new-password" className={inputClass} />
            </Field>
            <div className="flex items-end">
              <button type="submit" className={buttonClass("primary")}>إضافة المعلم</button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">إسناد مادة إلى فصل</h2>
          <form action={createAssignmentAction} className="grid gap-4 sm:grid-cols-2">
            <Field label="الفصل" name="classId">
              <select id="classId" name="classId" required defaultValue="" className={inputClass}>
                <option value="" disabled>اختر الفصل</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="المادة" name="subjectId">
              <select id="subjectId" name="subjectId" required defaultValue="" className={inputClass}>
                <option value="" disabled>اختر المادة</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="المعلم" name="teacherId">
              <select id="teacherId" name="teacherId" required defaultValue="" className={inputClass}>
                <option value="" disabled>اختر المعلم</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.user.name} — {t.specialty}</option>
                ))}
              </select>
            </Field>
            <Field label="الحصص في الأسبوع" name="periodsPerWeek">
              <input id="periodsPerWeek" name="periodsPerWeek" type="number" min={1} max={10} defaultValue={3} required dir="ltr" className={inputClass} />
            </Field>
            <div className="sm:col-span-2">
              <button type="submit" className={buttonClass("primary")}>حفظ الإسناد</button>
            </div>
          </form>
        </Card>
      </div>

      <h2 className="mb-3 text-xl font-bold">قائمة المعلمين</h2>
      {teachers.length === 0 ? (
        <EmptyState title="لا يوجد معلمون" />
      ) : (
        <TableWrap>
          <caption className="sr-only">المعلمون</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>المعلم</th>
              <th scope="col" className={th}>التخصص</th>
              <th scope="col" className={th}>البريد</th>
              <th scope="col" className={th}>الإسنادات</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td className={`${td} font-medium`}>{t.user.name}</td>
                <td className={td}>{t.specialty}</td>
                <td className={td} dir="ltr">{t.user.email}</td>
                <td className={td}>{t._count.assignments}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <h2 className="mb-3 mt-8 text-xl font-bold">الإسنادات الحالية</h2>
      {assignments.length === 0 ? (
        <EmptyState title="لا توجد إسنادات بعد" />
      ) : (
        <TableWrap>
          <caption className="sr-only">إسناد المواد للفصول</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>الفصل</th>
              <th scope="col" className={th}>المادة</th>
              <th scope="col" className={th}>المعلم</th>
              <th scope="col" className={th}>الحصص/أسبوع</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td className={td}>{a.class.name}</td>
                <td className={td}>{a.subject.name}</td>
                <td className={td}>{a.teacher.user.name}</td>
                <td className={td}>{a.periodsPerWeek}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
