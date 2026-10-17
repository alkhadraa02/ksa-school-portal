import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { first, parentChildren, pickChild, type OneOrMany } from "@/lib/portal";
import { ChildTabs } from "@/components/child-tabs";
import { TimetableGrid } from "@/components/timetable-grid";
import { EmptyState, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "الجدول الدراسي" };

export default async function ParentTimetable({ searchParams }: { searchParams: Promise<{ child?: OneOrMany }> }) {
  const user = await requireRole("PARENT");
  const kids = await parentChildren(user.id);
  const child = pickChild(kids, first((await searchParams).child));
  if (!child) return <EmptyState title="لا يوجد أبناء مرتبطون بحسابك" />;
  if (!child.classId) return <EmptyState title="الطالب غير مسجّل في فصل بعد" />;

  const slots = await db.timetableSlot.findMany({
    where: { classId: child.classId },
    include: { subject: true, teacher: { include: { user: true } } },
  });

  return (
    <>
      <PageHeader title="الجدول الدراسي" lead={`${child.name} — ${child.class?.name ?? ""}`} />
      <ChildTabs children={kids} active={child.id} base="/parent/timetable" />
      {slots.length === 0 ? (
        <EmptyState title="لم يُعتمد جدول هذا الفصل بعد" />
      ) : (
        <TimetableGrid
          caption={`الجدول الأسبوعي للطالب ${child.name}`}
          cells={slots.map((s) => ({ day: s.day, period: s.period, title: s.subject.name, sub: s.teacher.user.name }))}
        />
      )}
    </>
  );
}
