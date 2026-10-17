import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { teacherContext } from "@/lib/portal";
import { TimetableGrid } from "@/components/timetable-grid";
import { Card, EmptyState, PageHeader, Stat } from "@/components/ui";
import { formatNumber } from "@/lib/format";

export default async function TeacherHome() {
  const user = await requireRole("TEACHER");
  const ctx = await teacherContext(user.id);
  if (!ctx) return <EmptyState title="لا يوجد ملف معلم مرتبط بحسابك" hint="تواصل مع الإدارة." />;

  const classIds = [...new Set(ctx.assignments.map((a) => a.classId))];
  const [slots, studentCount, unread] = await Promise.all([
    db.timetableSlot.findMany({
      where: { teacherId: ctx.teacher.id },
      include: { subject: true, class: true },
    }),
    db.student.count({ where: { classId: { in: classIds }, status: "ACTIVE" } }),
    db.message.count({ where: { toId: user.id, readAt: null } }),
  ]);

  return (
    <>
      <PageHeader title={`مرحباً ${user.name.split(" ")[0]}`} lead={`التخصص: ${ctx.teacher.specialty}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="الفصول" value={formatNumber(classIds.length)} />
        <Stat label="الطلاب" value={formatNumber(studentCount)} />
        <Stat label="رسائل غير مقروءة" value={formatNumber(unread)} />
      </div>

      <h2 className="mb-3 text-xl font-bold">فصولي ومواديّ</h2>
      {ctx.assignments.length === 0 ? (
        <EmptyState title="لم يُسنَد إليك أي فصل بعد" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {ctx.assignments.map((a) => (
            <li key={a.id}>
              <Card className="h-full">
                <p className="font-bold">{a.subject.name}</p>
                <p className="text-sm text-muted">{a.class.name} · {a.periodsPerWeek} حصص أسبوعياً</p>
                <p className="mt-3 flex flex-wrap gap-3 text-sm">
                  <Link className="text-brand underline" href={`/teacher/attendance?class=${a.classId}`}>الحضور</Link>
                  <Link className="text-brand underline" href="/teacher/grades">الدرجات</Link>
                  <Link className="text-brand underline" href="/teacher/homework">الواجبات</Link>
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 mt-8 text-xl font-bold">جدولي الأسبوعي</h2>
      {slots.length === 0 ? (
        <EmptyState title="لا توجد حصص في جدولك بعد" />
      ) : (
        <TimetableGrid
          caption="الجدول الأسبوعي للمعلم"
          cells={slots.map((s) => ({ day: s.day, period: s.period, title: s.subject.name, sub: s.class.name }))}
        />
      )}
    </>
  );
}
