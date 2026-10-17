import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { first, parentChildren, pickChild, type OneOrMany } from "@/lib/portal";
import { gradeLabel, gradeTone, percent, weightedAverage } from "@/lib/grades";
import { ChildTabs } from "@/components/child-tabs";
import { Badge, Card, EmptyState, PageHeader, TableWrap, td, th } from "@/components/ui";
import { formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "الدرجات" };

export default async function ParentGrades({ searchParams }: { searchParams: Promise<{ child?: OneOrMany }> }) {
  const user = await requireRole("PARENT");
  const kids = await parentChildren(user.id);
  const child = pickChild(kids, first((await searchParams).child));
  if (!child) return <EmptyState title="لا يوجد أبناء مرتبطون بحسابك" />;

  const grades = await db.grade.findMany({
    where: { studentId: child.id },
    include: { assessment: { include: { subject: true } } },
    orderBy: { assessment: { date: "desc" } },
  });

  const bySubject = new Map<string, { name: string; entries: { score: number; max: number }[] }>();
  for (const g of grades) {
    const e = bySubject.get(g.assessment.subjectId) ?? { name: g.assessment.subject.name, entries: [] };
    e.entries.push({ score: g.score, max: g.assessment.maxScore });
    bySubject.set(g.assessment.subjectId, e);
  }
  const overall = weightedAverage(grades.map((g) => ({ score: g.score, max: g.assessment.maxScore })));

  return (
    <>
      <PageHeader title="الدرجات" lead={child.name} />
      <ChildTabs children={kids} active={child.id} base="/parent/grades" />
      {grades.length === 0 ? (
        <EmptyState title="لا توجد درجات مرصودة بعد" />
      ) : (
        <>
          <section aria-label="المتوسطات" className="mb-6">
            <h2 className="mb-3 text-xl font-bold">
              المتوسط العام: {overall === null ? "—" : `${formatNumber(overall)}%`}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[...bySubject.values()].map((s) => {
                const avg = weightedAverage(s.entries) ?? 0;
                return (
                  <li key={s.name}>
                    <Card>
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="mt-1 text-2xl font-bold">{formatNumber(avg)}%</p>
                      <Badge tone={gradeTone(avg)}>{gradeLabel(avg)}</Badge>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
          <h2 className="mb-3 text-xl font-bold">تفاصيل التقييمات</h2>
          <TableWrap>
            <caption className="sr-only">تفاصيل الدرجات</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>المادة</th>
                <th scope="col" className={th}>التقييم</th>
                <th scope="col" className={th}>الفصل</th>
                <th scope="col" className={th}>التاريخ</th>
                <th scope="col" className={th}>الدرجة</th>
                <th scope="col" className={th}>النسبة</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g) => {
                const p = percent(g.score, g.assessment.maxScore);
                return (
                  <tr key={g.id}>
                    <td className={td}>{g.assessment.subject.name}</td>
                    <td className={td}>{g.assessment.title}</td>
                    <td className={td}>{g.assessment.term}</td>
                    <td className={td}>{formatDate(g.assessment.date)}</td>
                    <td className={td}>
                      {formatNumber(g.score)} / {formatNumber(g.assessment.maxScore)}
                    </td>
                    <td className={td}>
                      <Badge tone={gradeTone(p)}>{formatNumber(p)}%</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </>
      )}
    </>
  );
}
