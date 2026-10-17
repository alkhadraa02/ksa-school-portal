import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parentChildren } from "@/lib/portal";
import { summarizeAttendance } from "@/lib/attendance";
import { balance, invoiceStatus } from "@/lib/fees";
import { weightedAverage } from "@/lib/grades";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { ageFrom, formatDateTime, formatNumber, formatSar } from "@/lib/format";
import { AUDIENCE_LABELS } from "@/lib/constants";

export default async function ParentHome() {
  const user = await requireRole("PARENT");
  const kids = await parentChildren(user.id);
  const kidIds = kids.map((k) => k.id);

  const [attendance, grades, invoices, announcements, unread] = await Promise.all([
    db.attendance.findMany({ where: { studentId: { in: kidIds } } }),
    db.grade.findMany({ where: { studentId: { in: kidIds } }, include: { assessment: true } }),
    db.invoice.findMany({ where: { studentId: { in: kidIds } }, include: { payments: true } }),
    db.announcement.findMany({ where: { audience: { in: ["ALL", "PARENTS"] } }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.message.count({ where: { toId: user.id, readAt: null } }),
  ]);

  const due = invoices.reduce((s, i) => s + balance(i), 0);
  const overdue = invoices.filter((i) => invoiceStatus(i) === "OVERDUE").length;

  return (
    <>
      <PageHeader title={`مرحباً ${user.name.split(" ")[0]}`} lead="ملخص أبنائك والمستجدات." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="عدد الأبناء" value={formatNumber(kids.length)} />
        <Stat label="المبالغ المستحقة" value={formatSar(due)} hint={overdue ? `${overdue} فاتورة متأخرة` : "لا توجد متأخرات"} />
        <Stat label="رسائل غير مقروءة" value={formatNumber(unread)} />
      </div>

      <h2 className="mb-3 text-xl font-bold">أبنائي</h2>
      {kids.length === 0 ? (
        <EmptyState title="لا يوجد أبناء مرتبطون بحسابك" hint="تواصل مع إدارة المدرسة لربط الطلاب بحسابك." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {kids.map((k) => {
            const att = summarizeAttendance(attendance.filter((a) => a.studentId === k.id));
            const avg = weightedAverage(
              grades.filter((g) => g.studentId === k.id).map((g) => ({ score: g.score, max: g.assessment.maxScore })),
            );
            return (
              <li key={k.id}>
                <Card className="h-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="min-w-0 truncate text-lg font-bold">{k.name}</h3>
                    <Badge tone="info">{k.class?.name ?? "بدون فصل"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    رقم الطالب <span dir="ltr">{k.studentNo}</span> · العمر {ageFrom(k.birthDate)} سنة
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-muted">نسبة الحضور</dt>
                      <dd className="text-lg font-bold">{att.total ? `${formatNumber(att.rate)}%` : "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">متوسط الدرجات</dt>
                      <dd className="text-lg font-bold">{avg === null ? "—" : `${formatNumber(avg)}%`}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 flex flex-wrap gap-3 text-sm">
                    <Link className="text-brand underline" href={`/parent/attendance?child=${k.id}`}>الحضور</Link>
                    <Link className="text-brand underline" href={`/parent/grades?child=${k.id}`}>الدرجات</Link>
                    <Link className="text-brand underline" href={`/parent/timetable?child=${k.id}`}>الجدول</Link>
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mb-3 mt-8 text-xl font-bold">إعلانات المدرسة</h2>
      {announcements.length === 0 ? (
        <EmptyState title="لا توجد إعلانات" />
      ) : (
        <ul className="grid gap-3">
          {announcements.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">{a.title}</h3>
                  <Badge>{AUDIENCE_LABELS[a.audience] ?? a.audience}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{formatDateTime(a.createdAt)}</p>
                <p className="mt-2 text-sm">{a.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
