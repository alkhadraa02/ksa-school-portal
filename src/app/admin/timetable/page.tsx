import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, EmptyState, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { Flash } from "@/components/flash";
import { TimetableGrid, type GridCell } from "@/components/timetable-grid";
import { addSlotAction, generateTimetableAction, removeSlotAction } from "@/app/actions/admin";
import { first, type OneOrMany } from "@/lib/portal";
import { DAYS, PERIODS_PER_DAY } from "@/lib/constants";

export const metadata: Metadata = { title: "الجدول الدراسي" };

export default async function TimetablePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const classes = await db.classGroup.findMany({ orderBy: [{ stage: "asc" }, { level: "asc" }, { section: "asc" }] });
  const selected = classes.find((c) => c.id === first(params.class)) ?? classes[0];

  if (!selected) {
    return (
      <>
        <PageHeader title="الجدول الدراسي" />
        <EmptyState title="لا توجد فصول" hint="أنشئ فصلاً أولاً من صفحة الفصول والشعب." />
      </>
    );
  }

  const [slots, assignments] = await Promise.all([
    db.timetableSlot.findMany({
      where: { classId: selected.id },
      include: { subject: true, teacher: { include: { user: true } } },
      orderBy: [{ day: "asc" }, { period: "asc" }],
    }),
    db.teachingAssignment.findMany({
      where: { classId: selected.id },
      include: { subject: true, teacher: { include: { user: true } } },
      orderBy: { subject: { name: "asc" } },
    }),
  ]);

  const placed = new Map<string, number>();
  for (const s of slots) placed.set(s.subjectId, (placed.get(s.subjectId) ?? 0) + 1);

  const cells: GridCell[] = slots.map((s) => ({
    day: s.day,
    period: s.period,
    title: s.subject.name,
    sub: s.teacher.user.name,
  }));

  return (
    <>
      <PageHeader
        title="الجدول الدراسي"
        lead="يمنع النظام تعارض المعلم أو الفصل في الحصة نفسها، ويمكنك التوليد التلقائي أو الإضافة اليدوية."
      />
      <Flash params={params} />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="الفصل" name="class">
          <select id="class" name="class" defaultValue={selected.id} className={inputClass}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <button type="submit" className={buttonClass("secondary")}>عرض</button>
      </form>

      <TimetableGrid cells={cells} caption={`الجدول الأسبوعي لفصل ${selected.name}`} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-1 text-lg font-bold">التوليد التلقائي</h2>
          <p className="mb-3 text-sm text-muted">
            يعيد بناء جدول هذا الفصل من إسنادات المواد دون التعارض مع جداول الفصول الأخرى. سيُستبدل الجدول الحالي.
          </p>
          <form action={generateTimetableAction}>
            <input type="hidden" name="classId" value={selected.id} />
            <button type="submit" className={buttonClass("primary")}>توليد الجدول</button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">إضافة حصة يدوياً</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted">لا توجد مواد مُسنَدة لهذا الفصل، أسندها من صفحة المعلمين.</p>
          ) : (
            <form action={addSlotAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="classId" value={selected.id} />
              <Field label="المادة والمعلم" name="assignmentId">
                <select id="assignmentId" name="assignmentId" required className={inputClass}>
                  {assignments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.subject.name} — {a.teacher.user.name} ({placed.get(a.subjectId) ?? 0}/{a.periodsPerWeek})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="اليوم" name="day">
                <select id="day" name="day" required className={inputClass}>
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="الحصة" name="period">
                <select id="period" name="period" required className={inputClass}>
                  {Array.from({ length: PERIODS_PER_DAY }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>الحصة {p}</option>
                  ))}
                </select>
              </Field>
              <div className="flex items-end">
                <button type="submit" className={buttonClass("primary")}>إضافة</button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {slots.length > 0 ? (
        <section className="mt-6" aria-label="حذف حصص">
          <h2 className="mb-3 text-lg font-bold">حصص الفصل</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {slots.map((s) => (
              <li key={s.id}>
                <Card className="flex items-center justify-between gap-2 py-3">
                  <span className="min-w-0 truncate text-sm">
                    {DAYS[s.day]} · الحصة {s.period} · {s.subject.name}
                  </span>
                  <form action={removeSlotAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="classId" value={selected.id} />
                    <button
                      type="submit"
                      className="min-h-11 rounded-lg px-3 text-sm text-danger underline"
                      aria-label={`حذف ${s.subject.name} ${DAYS[s.day]} الحصة ${s.period}`}
                    >
                      حذف
                    </button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
