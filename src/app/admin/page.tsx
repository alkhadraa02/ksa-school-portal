import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { balance, invoiceStatus } from "@/lib/fees";
import { formatDate, formatSar, todayISO } from "@/lib/format";
import { APPLICATION_LABELS, type ApplicationStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "نظرة عامة" };

export default async function AdminHome() {
  const today = todayISO();
  const [students, teachers, classes, pending, invoices, attendance, applications, announcements] = await Promise.all([
    db.student.count({ where: { status: "ACTIVE" } }),
    db.teacher.count(),
    db.classGroup.count(),
    db.application.count({ where: { status: { in: ["PENDING", "REVIEW"] } } }),
    db.invoice.findMany({ include: { payments: true } }),
    db.attendance.findMany({ where: { date: today }, select: { status: true } }),
    db.application.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
  ]);
  const due = invoices.reduce((s, i) => s + balance(i), 0);
  const overdue = invoices.filter((i) => invoiceStatus(i) === "OVERDUE").length;
  const present = attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;

  return (
    <>
      <PageHeader title="نظرة عامة" lead="ملخص سريع لحالة المدرسة اليوم." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="الطلاب الحاليون" value={students} />
        <Stat label="المعلمون" value={teachers} />
        <Stat label="الفصول والشعب" value={classes} />
        <Stat label="طلبات قبول بانتظار المراجعة" value={pending} />
        <Stat label="إجمالي المستحق على الفواتير" value={formatSar(due)} hint={`${overdue} فاتورة متأخرة`} />
        <Stat
          label="حضور اليوم"
          value={attendance.length ? `${present} / ${attendance.length}` : "—"}
          hint={attendance.length ? "حاضر أو متأخر من المسجَّلين" : "لم يُسجَّل الحضور بعد"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-label="آخر طلبات القبول">
          <h2 className="mb-3 text-xl font-bold">آخر طلبات القبول</h2>
          {applications.length === 0 ? (
            <EmptyState title="لا توجد طلبات" />
          ) : (
            <ul className="grid gap-2">
              {applications.map((a) => (
                <li key={a.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.studentName}</p>
                      <p className="text-xs text-muted">{formatDate(a.createdAt)}</p>
                    </div>
                    <Badge tone={a.status === "ACCEPTED" ? "success" : a.status === "REJECTED" ? "danger" : "info"}>
                      {APPLICATION_LABELS[a.status as ApplicationStatus] ?? a.status}
                    </Badge>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/admissions" className="mt-3 inline-block text-sm font-medium text-brand underline">
            كل الطلبات
          </Link>
        </section>
        <section aria-label="آخر الإعلانات">
          <h2 className="mb-3 text-xl font-bold">آخر الإعلانات</h2>
          {announcements.length === 0 ? (
            <EmptyState title="لا توجد إعلانات" />
          ) : (
            <ul className="grid gap-2">
              {announcements.map((a) => (
                <li key={a.id}>
                  <Card className="py-3">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted">{formatDate(a.createdAt)}</p>
                  </Card>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/announcements" className="mt-3 inline-block text-sm font-medium text-brand underline">
            إدارة الإعلانات
          </Link>
        </section>
      </div>
    </>
  );
}
