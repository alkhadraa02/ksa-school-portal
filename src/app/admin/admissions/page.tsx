import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { Flash } from "@/components/flash";
import { reviewApplicationAction } from "@/app/actions/admin";
import { first, type OneOrMany } from "@/lib/portal";
import { ageFrom, formatDate } from "@/lib/format";
import { APPLICATION_LABELS, APPLICATION_STATUSES, levelName, stageLabel, type ApplicationStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "طلبات القبول" };

const TONES: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  PENDING: "neutral",
  REVIEW: "info",
  ACCEPTED: "success",
  WAITLIST: "warning",
  REJECTED: "danger",
};

export default async function AdmissionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const filter = first(params.status);
  const valid = APPLICATION_STATUSES.find((s) => s === filter);
  const [apps, counts] = await Promise.all([
    db.application.findMany({ where: valid ? { status: valid } : undefined, orderBy: { createdAt: "desc" }, take: 200 }),
    db.application.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <>
      <PageHeader title="طلبات القبول" lead="راجع الطلبات الواردة من الموقع وحدّث حالتها ليراها ولي الأمر." />
      <Flash params={params} />

      <nav aria-label="تصفية الطلبات" className="mb-4 flex flex-wrap gap-2">
        <a href="/admin/admissions" className={buttonClass(valid ? "secondary" : "primary")}>الكل</a>
        {APPLICATION_STATUSES.map((s) => (
          <a key={s} href={`/admin/admissions?status=${s}`} className={buttonClass(valid === s ? "primary" : "secondary")}>
            {APPLICATION_LABELS[s]} ({countOf(s)})
          </a>
        ))}
      </nav>

      {apps.length === 0 ? (
        <EmptyState title="لا توجد طلبات في هذا التصنيف" />
      ) : (
        <ul className="grid gap-4">
          {apps.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{a.studentName}</h2>
                    <p className="text-sm text-muted">
                      <span dir="ltr">{a.reference}</span> · {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <Badge tone={TONES[a.status] ?? "neutral"}>{APPLICATION_LABELS[a.status as ApplicationStatus] ?? a.status}</Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-muted">الصف المطلوب</dt>
                    <dd>{levelName(a.stage, a.level)} — {stageLabel(a.stage)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">العمر</dt>
                    <dd>{ageFrom(a.birthDate)} سنة · {a.gender === "M" ? "ذكر" : "أنثى"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">ولي الأمر</dt>
                    <dd>{a.guardianName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">الجوال</dt>
                    <dd dir="ltr" className="text-start">{a.phone}</dd>
                  </div>
                </dl>
                {a.previousSchool ? <p className="mt-2 text-sm">المدرسة السابقة: {a.previousSchool}</p> : null}
                {a.notes ? <p className="mt-1 text-sm text-muted">ملاحظات ولي الأمر: {a.notes}</p> : null}

                <form action={reviewApplicationAction} className="mt-4 grid gap-3 sm:grid-cols-[12rem_1fr_auto] sm:items-end">
                  <input type="hidden" name="id" value={a.id} />
                  <Field label="الحالة" name={`status-${a.id}`}>
                    <select id={`status-${a.id}`} name="status" defaultValue={a.status} className={inputClass}>
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{APPLICATION_LABELS[s]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="ملاحظة داخلية" name={`note-${a.id}`}>
                    <input id={`note-${a.id}`} name="adminNote" defaultValue={a.adminNote ?? ""} maxLength={500} className={inputClass} />
                  </Field>
                  <button type="submit" className={buttonClass("primary")}>حفظ</button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
