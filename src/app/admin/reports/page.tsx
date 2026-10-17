import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, Stat, TableWrap, td, th } from "@/components/ui";
import { balance, invoiceStatus, paidTotal } from "@/lib/fees";
import { formatNumber, formatSar } from "@/lib/format";
import { ATTENDANCE_LABELS, ATTENDANCE_STATUSES, stageLabel } from "@/lib/constants";

export const metadata: Metadata = { title: "التقارير" };

export default async function ReportsPage() {
  const [classes, attendance, invoices, assessments, applications] = await Promise.all([
    db.classGroup.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: [{ stage: "asc" }, { level: "asc" }, { section: "asc" }],
    }),
    db.attendance.findMany({ select: { status: true, student: { select: { classId: true } } } }),
    db.invoice.findMany({ include: { payments: true } }),
    db.assessment.findMany({ include: { grades: true, subject: true } }),
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const att = new Map<string, Record<string, number>>();
  for (const a of attendance) {
    const key = a.student.classId ?? "none";
    const row = att.get(key) ?? {};
    row[a.status] = (row[a.status] ?? 0) + 1;
    att.set(key, row);
  }

  const billed = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices.reduce((s, i) => s + paidTotal(i.payments), 0);
  const outstanding = invoices.reduce((s, i) => s + balance(i), 0);
  const overdue = invoices.filter((i) => invoiceStatus(i) === "OVERDUE").length;

  const bySubject = new Map<string, { sum: number; n: number }>();
  for (const a of assessments) {
    for (const g of a.grades) {
      const row = bySubject.get(a.subject.name) ?? { sum: 0, n: 0 };
      row.sum += (g.score / a.maxScore) * 100;
      row.n += 1;
      bySubject.set(a.subject.name, row);
    }
  }
  const subjectRows = [...bySubject.entries()]
    .map(([name, v]) => ({ name, avg: v.sum / v.n, n: v.n }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <>
      <PageHeader title="التقارير" lead="ملخصات الحضور والرسوم والتحصيل والقبول." />

      <section aria-label="الرسوم" className="mb-8">
        <h2 className="mb-3 text-xl font-bold">الرسوم</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="إجمالي الفواتير" value={formatSar(billed)} />
          <Stat label="المحصَّل" value={formatSar(collected)} hint={billed ? `${formatNumber((collected / billed) * 100)}٪ من الفواتير` : undefined} />
          <Stat label="المتبقي" value={formatSar(outstanding)} />
          <Stat label="فواتير متأخرة" value={overdue} />
        </div>
      </section>

      <section aria-label="الحضور حسب الفصل" className="mb-8">
        <h2 className="mb-3 text-xl font-bold">الحضور حسب الفصل</h2>
        {attendance.length === 0 ? (
          <EmptyState title="لا توجد سجلات حضور" />
        ) : (
          <TableWrap>
            <caption className="sr-only">الحضور حسب الفصل</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>الفصل</th>
                <th scope="col" className={th}>الطلاب</th>
                {ATTENDANCE_STATUSES.map((s) => (
                  <th key={s} scope="col" className={th}>{ATTENDANCE_LABELS[s]}</th>
                ))}
                <th scope="col" className={th}>نسبة الحضور</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => {
                const row = att.get(c.id) ?? {};
                const total = ATTENDANCE_STATUSES.reduce((s, k) => s + (row[k] ?? 0), 0);
                const ok = (row.PRESENT ?? 0) + (row.LATE ?? 0);
                return (
                  <tr key={c.id}>
                    <td className={`${td} font-medium`}>{c.name}<span className="block text-xs text-muted">{stageLabel(c.stage)}</span></td>
                    <td className={td}>{c._count.students}</td>
                    {ATTENDANCE_STATUSES.map((s) => (
                      <td key={s} className={td}>{row[s] ?? 0}</td>
                    ))}
                    <td className={td}>{total ? `${formatNumber((ok / total) * 100)}٪` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label="متوسط الدرجات حسب المادة">
          <h2 className="mb-3 text-xl font-bold">متوسط الدرجات حسب المادة</h2>
          {subjectRows.length === 0 ? (
            <EmptyState title="لا توجد درجات" />
          ) : (
            <TableWrap>
              <caption className="sr-only">متوسط الدرجات حسب المادة</caption>
              <thead>
                <tr>
                  <th scope="col" className={th}>المادة</th>
                  <th scope="col" className={th}>المتوسط</th>
                  <th scope="col" className={th}>عدد الدرجات</th>
                </tr>
              </thead>
              <tbody>
                {subjectRows.map((r) => (
                  <tr key={r.name}>
                    <td className={`${td} font-medium`}>{r.name}</td>
                    <td className={td}>{formatNumber(r.avg)}٪</td>
                    <td className={td}>{r.n}</td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </section>
        <section aria-label="طلبات القبول">
          <h2 className="mb-3 text-xl font-bold">طلبات القبول</h2>
          <Card>
            <ul className="grid gap-2 text-sm">
              {applications.length === 0 ? <li className="text-muted">لا توجد طلبات</li> : null}
              {applications.map((a) => (
                <li key={a.status} className="flex justify-between gap-3">
                  <span>{a.status}</span>
                  <strong>{a._count._all}</strong>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>
    </>
  );
}
