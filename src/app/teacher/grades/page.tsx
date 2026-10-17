import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { first, teacherContext, type OneOrMany } from "@/lib/portal";
import { createAssessmentAction } from "@/app/actions/teacher";
import { Flash } from "@/components/portal-shell";
import { Card, EmptyState, Field, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "الدرجات" };

export default async function TeacherGrades({
  searchParams,
}: {
  searchParams: Promise<{ ok?: OneOrMany; error?: OneOrMany }>;
}) {
  const user = await requireRole("TEACHER");
  const ctx = await teacherContext(user.id);
  if (!ctx) return <EmptyState title="لا يوجد ملف معلم مرتبط بحسابك" />;
  const sp = await searchParams;

  const assessments = await db.assessment.findMany({
    where: { teacherId: ctx.teacher.id },
    orderBy: { date: "desc" },
    include: { class: true, subject: true, _count: { select: { grades: true } } },
  });

  return (
    <>
      <PageHeader title="الدرجات" lead="أنشئ تقييماً ثم أدخل درجات الطلاب." />
      <Flash ok={first(sp.ok)} error={first(sp.error)} />
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card className="h-fit">
          <h2 className="mb-3 text-lg font-bold">تقييم جديد</h2>
          {ctx.assignments.length === 0 ? (
            <p className="text-sm text-muted">لم تُسنَد إليك مواد بعد.</p>
          ) : (
            <form action={createAssessmentAction} className="grid gap-3">
              <Field label="الفصل والمادة" name="pair">
                <select id="pair" name="pair" required className={inputClass}>
                  {ctx.assignments.map((a) => (
                    <option key={a.id} value={`${a.classId}|${a.subjectId}`}>
                      {a.subject.name} — {a.class.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="عنوان التقييم" name="title">
                <input id="title" name="title" required maxLength={80} placeholder="اختبار قصير 1" className={inputClass} />
              </Field>
              <Field label="الفصل الدراسي" name="term">
                <select id="term" name="term" defaultValue="1" className={inputClass}>
                  <option value="1">الأول</option>
                  <option value="2">الثاني</option>
                  <option value="3">الثالث</option>
                </select>
              </Field>
              <Field label="الدرجة العظمى" name="maxScore">
                <input id="maxScore" name="maxScore" type="number" min="1" max="1000" step="0.5" required defaultValue="20" dir="ltr" className={inputClass} />
              </Field>
              <button type="submit" className={buttonClass("primary")}>إنشاء وإدخال الدرجات</button>
            </form>
          )}
        </Card>
        <section aria-label="التقييمات">
          <h2 className="mb-3 text-lg font-bold">تقييماتي</h2>
          {assessments.length === 0 ? (
            <EmptyState title="لا توجد تقييمات بعد" />
          ) : (
            <TableWrap>
              <caption className="sr-only">قائمة التقييمات</caption>
              <thead>
                <tr>
                  <th scope="col" className={th}>التقييم</th>
                  <th scope="col" className={th}>المادة</th>
                  <th scope="col" className={th}>الفصل</th>
                  <th scope="col" className={th}>التاريخ</th>
                  <th scope="col" className={th}>العظمى</th>
                  <th scope="col" className={th}>المرصود</th>
                  <th scope="col" className={th}><span className="sr-only">إجراء</span></th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id}>
                    <td className={td}>{a.title}</td>
                    <td className={td}>{a.subject.name}</td>
                    <td className={td}>{a.class.name}</td>
                    <td className={td}>{formatDate(a.date)}</td>
                    <td className={td}>{formatNumber(a.maxScore)}</td>
                    <td className={td}>{formatNumber(a._count.grades)}</td>
                    <td className={td}>
                      <Link className="text-brand underline" href={`/teacher/grades/${a.id}`}>إدخال/تعديل</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </section>
      </div>
    </>
  );
}
