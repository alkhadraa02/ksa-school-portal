import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { allowedRecipients } from "@/lib/messaging";
import { sendMessageAction } from "@/app/actions/messages";
import { Badge, Card, EmptyState, Field, buttonClass, inputClass } from "./ui";
import { formatDateTime } from "@/lib/format";

export async function MessageCenter({ user, to }: { user: SessionUser; to?: string }) {
  const [recipients, messages] = await Promise.all([
    allowedRecipients(user),
    db.message.findMany({
      where: { OR: [{ toId: user.id }, { fromId: user.id }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { from: { select: { name: true } }, to: { select: { name: true } } },
    }),
  ]);

  const studentIds = [...new Set(messages.map((m) => m.studentId).filter((x): x is string => !!x))];
  const students = await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true } });
  const studentName = new Map(students.map((s) => [s.id, s.name]));
  await db.message.updateMany({ where: { toId: user.id, readAt: null }, data: { readAt: new Date() } });

  const allStudents = [...new Map(recipients.flatMap((r) => r.students).map((s) => [s.id, s])).values()];
  const preselected = recipients.some((r) => r.id === to) ? to : "";

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Card className="h-fit">
        <h2 className="mb-3 text-lg font-bold">رسالة جديدة</h2>
        {recipients.length === 0 ? (
          <p className="text-sm text-muted">لا يوجد مستلمون متاحون حالياً.</p>
        ) : (
          <form action={sendMessageAction} className="grid gap-3">
            <Field label="إلى" name="toId">
              <select id="toId" name="toId" required defaultValue={preselected} className={inputClass}>
                <option value="" disabled>اختر المستلم</option>
                {recipients.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="بخصوص الطالب (اختياري)" name="studentId">
              <select id="studentId" name="studentId" defaultValue="" className={inputClass}>
                <option value="">— بدون —</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </Field>
            <Field label="الموضوع" name="subject">
              <input id="subject" name="subject" required maxLength={100} className={inputClass} />
            </Field>
            <Field label="نص الرسالة" name="body">
              <textarea id="body" name="body" required rows={5} maxLength={2000} className={inputClass} />
            </Field>
            <button type="submit" className={buttonClass("primary")}>إرسال</button>
          </form>
        )}
      </Card>
      <section aria-label="الرسائل">
        <h2 className="mb-3 text-lg font-bold">صندوق الرسائل</h2>
        {messages.length === 0 ? (
          <EmptyState title="لا توجد رسائل بعد" hint="ستظهر هنا الرسائل الواردة والمرسلة." />
        ) : (
          <ul className="grid gap-3">
            {messages.map((m) => {
              const incoming = m.toId === user.id;
              return (
                <li key={m.id}>
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="min-w-0 truncate font-bold">{m.subject}</p>
                      <Badge tone={incoming ? "info" : "neutral"}>{incoming ? "واردة" : "مرسلة"}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {incoming ? `من ${m.from.name}` : `إلى ${m.to.name}`} · {formatDateTime(m.createdAt)}
                      {m.studentId && studentName.get(m.studentId) ? ` · بخصوص ${studentName.get(m.studentId)}` : ""}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm">{m.body}</p>
                    {incoming && recipients.some((r) => r.id === m.fromId) ? (
                      <a href={`?to=${m.fromId}`} className="mt-2 inline-flex min-h-8 items-center text-sm text-brand underline">
                        رد
                      </a>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
