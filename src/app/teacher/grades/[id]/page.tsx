import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { first, teacherContext, type OneOrMany } from "@/lib/portal";
import { saveScoresAction } from "@/app/actions/teacher";
import { Flash } from "@/components/portal-shell";
import { EmptyState, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "إدخال الدرجات" };

export default async function AssessmentScores({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: OneOrMany; error?: OneOrMany }>;
}) {
  const user = await requireRole("TEACHER");
  const ctx = await teacherContext(user.id);
  if (!ctx) return <EmptyState title="لا يوجد ملف معلم مرتبط بحسابك" />;
  const { id } = await params;
  const sp = await searchParams;

  const assessment = await db.assessment.findUnique({
    where: { id },
    include: { class: true, subject: true, grades: true },
  });
  if (!assessment || assessment.teacherId !== ctx.teacher.id) notFound();

  const students = await db.student.findMany({
    where: { classId: assessment.classId, status: "ACTIVE" },
    orderBy: { name: "asc" },
  });
  const scoreOf = new Map(assessment.grades.map((g) => [g.studentId, g.score]));

  return (
    <>
      <PageHeader
        title={assessment.title}
        lead={`${assessment.subject.name} — ${assessment.class.name} · الدرجة العظمى ${formatNumber(assessment.maxScore)}`}
      />
      <Flash ok={first(sp.ok)} error={first(sp.error)} />
      {students.length === 0 ? (
        <EmptyState title="لا يوجد طلاب في هذا الفصل" />
      ) : (
        <form action={saveScoresAction}>
          <input type="hidden" name="assessmentId" value={assessment.id} />
          <TableWrap>
            <caption className="sr-only">درجات {assessment.title}</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>الطالب</th>
                <th scope="col" className={th}>الدرجة من {formatNumber(assessment.maxScore)}</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className={td}>{s.name}</td>
                  <td className={td}>
                    <label htmlFor={`score_${s.id}`} className="sr-only">درجة {s.name}</label>
                    <input
                      id={`score_${s.id}`}
                      name={`score_${s.id}`}
                      type="number"
                      min="0"
                      max={assessment.maxScore}
                      step="0.25"
                      dir="ltr"
                      defaultValue={scoreOf.get(s.id) ?? ""}
                      className={`${inputClass} max-w-40`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-2 text-xs text-muted">اترك الخانة فارغة إن لم يُقيَّم الطالب.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className={buttonClass("primary")}>حفظ الدرجات</button>
            <Link href="/teacher/grades" className="text-sm text-brand underline">العودة إلى التقييمات</Link>
          </div>
        </form>
      )}
    </>
  );
}
