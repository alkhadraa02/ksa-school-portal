import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { first, teacherContext, type OneOrMany } from "@/lib/portal";
import { createHomeworkAction, deleteHomeworkAction } from "@/app/actions/teacher";
import { Flash } from "@/components/portal-shell";
import { Badge, Card, EmptyState, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { addDaysISO, formatDate, todayISO } from "@/lib/format";

export const metadata: Metadata = { title: "الواجبات" };

export default async function TeacherHomework({
  searchParams,
}: {
  searchParams: Promise<{ ok?: OneOrMany; error?: OneOrMany }>;
}) {
  const user = await requireRole("TEACHER");
  const ctx = await teacherContext(user.id);
  if (!ctx) return <EmptyState title="لا يوجد ملف معلم مرتبط بحسابك" />;
  const sp = await searchParams;

  const items = await db.homework.findMany({
    where: { teacherId: ctx.teacher.id },
    orderBy: { dueDate: "desc" },
    take: 40,
    include: { class: true, subject: true },
  });
  const today = todayISO();

  return (
    <>
      <PageHeader title="الواجبات" lead="انشر واجباً لفصل ومادة، ويظهر لأولياء الأمور في بوابتهم." />
      <Flash ok={first(sp.ok)} error={first(sp.error)} />
      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card className="h-fit">
          <h2 className="mb-3 text-lg font-bold">واجب جديد</h2>
          {ctx.assignments.length === 0 ? (
            <p className="text-sm text-muted">لم تُسنَد إليك مواد بعد.</p>
          ) : (
            <form action={createHomeworkAction} className="grid gap-3">
              <Field label="الفصل والمادة" name="pair">
                <select id="pair" name="pair" required className={inputClass}>
                  {ctx.assignments.map((a) => (
                    <option key={a.id} value={`${a.classId}|${a.subjectId}`}>
                      {a.subject.name} — {a.class.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="العنوان" name="title">
                <input id="title" name="title" required maxLength={100} className={inputClass} />
              </Field>
              <Field label="الوصف" name="body">
                <textarea id="body" name="body" required rows={4} maxLength={1500} className={inputClass} />
              </Field>
              <Field label="تاريخ التسليم" name="dueDate">
                <input id="dueDate" name="dueDate" type="date" required min={today} defaultValue={addDaysISO(today, 3)} dir="ltr" className={inputClass} />
              </Field>
              <button type="submit" className={buttonClass("primary")}>نشر الواجب</button>
            </form>
          )}
        </Card>
        <section aria-label="الواجبات المنشورة">
          <h2 className="mb-3 text-lg font-bold">واجباتي المنشورة</h2>
          {items.length === 0 ? (
            <EmptyState title="لم تنشر أي واجب بعد" />
          ) : (
            <ul className="grid gap-3">
              {items.map((h) => (
                <li key={h.id}>
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold">{h.title}</h3>
                      <Badge tone={h.dueDate < today ? "neutral" : "warning"}>
                        {h.dueDate < today ? "انتهى موعده" : `يُسلَّم ${formatDate(h.dueDate)}`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted">{h.subject.name} — {h.class.name}</p>
                    <p className="mt-2 whitespace-pre-line text-sm">{h.body}</p>
                    <form action={deleteHomeworkAction} className="mt-3">
                      <input type="hidden" name="id" value={h.id} />
                      <button type="submit" className={buttonClass("secondary")}>حذف</button>
                    </form>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
