import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { first, parentChildren, pickChild, type OneOrMany } from "@/lib/portal";
import { summarizeAttendance } from "@/lib/attendance";
import { ChildTabs } from "@/components/child-tabs";
import { Badge, EmptyState, PageHeader, Stat, TableWrap, td, th } from "@/components/ui";
import { ATTENDANCE_LABELS, type AttendanceStatus } from "@/lib/constants";
import { formatDate, formatNumber, formatWeekday } from "@/lib/format";

export const metadata: Metadata = { title: "الحضور والغياب" };

const TONE: Record<string, "success" | "danger" | "warning" | "info"> = {
  PRESENT: "success",
  ABSENT: "danger",
  LATE: "warning",
  EXCUSED: "info",
};

export default async function ParentAttendance({ searchParams }: { searchParams: Promise<{ child?: OneOrMany }> }) {
  const user = await requireRole("PARENT");
  const kids = await parentChildren(user.id);
  const child = pickChild(kids, first((await searchParams).child));
  if (!child) return <EmptyState title="لا يوجد أبناء مرتبطون بحسابك" />;

  const records = await db.attendance.findMany({ where: { studentId: child.id }, orderBy: { date: "desc" } });
  const s = summarizeAttendance(records);

  return (
    <>
      <PageHeader title="الحضور والغياب" lead={child.name} />
      <ChildTabs children={kids} active={child.id} base="/parent/attendance" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="نسبة الحضور" value={s.total ? `${formatNumber(s.rate)}%` : "—"} />
        <Stat label="أيام الحضور" value={formatNumber(s.present)} />
        <Stat label="أيام الغياب" value={formatNumber(s.absent)} />
        <Stat label="التأخر" value={formatNumber(s.late)} />
        <Stat label="غياب بعذر" value={formatNumber(s.excused)} />
      </div>
      {records.length === 0 ? (
        <EmptyState title="لا توجد سجلات حضور بعد" />
      ) : (
        <TableWrap>
          <caption className="sr-only">سجل الحضور</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>التاريخ</th>
              <th scope="col" className={th}>اليوم</th>
              <th scope="col" className={th}>الحالة</th>
              <th scope="col" className={th}>ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {records.slice(0, 60).map((r) => (
              <tr key={r.id}>
                <td className={td}>{formatDate(`${r.date}T12:00:00Z`)}</td>
                <td className={td}>{formatWeekday(`${r.date}T12:00:00Z`)}</td>
                <td className={td}>
                  <Badge tone={TONE[r.status] ?? "neutral"}>{ATTENDANCE_LABELS[r.status as AttendanceStatus] ?? r.status}</Badge>
                </td>
                <td className={td}>{r.note ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
