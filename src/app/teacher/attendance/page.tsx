import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { first, teacherContext, type OneOrMany } from "@/lib/portal";
import { saveAttendanceAction } from "@/app/actions/teacher";
import { Flash } from "@/components/portal-shell";
import { EmptyState, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { ATTENDANCE_LABELS, ATTENDANCE_STATUSES } from "@/lib/constants";
import { isSchoolDay, todayISO } from "@/lib/format";

export const metadata: Metadata = { title: "تسجيل الحضور" };

export default async function TeacherAttendance({
  searchParams,
}: {
  searchParams: Promise<{ class?: OneOrMany; date?: OneOrMany; ok?: OneOrMany; error?: OneOrMany }>;
}) {
  const user = await requireRole("TEACHER");
  const ctx = await teacherContext(user.id);
  if (!ctx) return <EmptyState title="لا يوجد ملف معلم مرتبط بحسابك" />;
  const sp = await searchParams;

  const classes = [...new Map(ctx.assignments.map((a) => [a.classId, a.class])).values()];
  if (classes.length === 0) return <EmptyState title="لم يُسنَد إليك أي فصل بعد" />;
  const selected = classes.find((c) => c.id === first(sp.class)) ?? classes[0];
  const rawDate = first(sp.date);
  const date = rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : todayISO();

  const students = await db.student.findMany({
    where: { classId: selected.id, status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: { attendance: { where: { date } } },
  });

  return (
    <>
      <PageHeader title="تسجيل الحضور" lead="اختر الفصل والتاريخ ثم سجّل حالة كل طالب." />
      <Flash ok={first(sp.ok)} error={first(sp.error)} />
      <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="class" className="mb-1 block text-sm font-medium">الفصل</label>
          <select id="class" name="class" defaultValue={selected.id} className={inputClass}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="date" className="mb-1 block text-sm font-medium">التاريخ</label>
          <input id="date" name="date" type="date" defaultValue={date} max={todayISO()} dir="ltr" className={inputClass} />
        </div>
        <button type="submit" className={buttonClass("secondary")}>عرض</button>
      </form>

      {!isSchoolDay(date) ? (
        <EmptyState title="التاريخ المختار إجازة أسبوعية" hint="الدراسة من الأحد إلى الخميس." />
      ) : students.length === 0 ? (
        <EmptyState title="لا يوجد طلاب في هذا الفصل" />
      ) : (
        <form action={saveAttendanceAction}>
          <input type="hidden" name="classId" value={selected.id} />
          <input type="hidden" name="date" value={date} />
          <TableWrap>
            <caption className="sr-only">حضور {selected.name}</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>الطالب</th>
                <th scope="col" className={th}>الحالة</th>
                <th scope="col" className={th}>ملاحظة</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td className={td}>{s.name}</td>
                  <td className={td}>
                    <label htmlFor={`status_${s.id}`} className="sr-only">حالة {s.name}</label>
                    <select
                      id={`status_${s.id}`}
                      name={`status_${s.id}`}
                      defaultValue={s.attendance[0]?.status ?? "PRESENT"}
                      className={inputClass}
                    >
                      {ATTENDANCE_STATUSES.map((st) => (
                        <option key={st} value={st}>{ATTENDANCE_LABELS[st]}</option>
                      ))}
                    </select>
                  </td>
                  <td className={td}>
                    <label htmlFor={`note_${s.id}`} className="sr-only">ملاحظة عن {s.name}</label>
                    <input id={`note_${s.id}`} name={`note_${s.id}`} maxLength={200} defaultValue={s.attendance[0]?.note ?? ""} className={inputClass} />
                  </td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="submit" className={buttonClass("primary")}>حفظ الحضور</button>
            <Link href="/teacher" className="text-sm text-brand underline">العودة</Link>
          </div>
        </form>
      )}
    </>
  );
}
