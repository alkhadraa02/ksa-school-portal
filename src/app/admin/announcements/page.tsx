import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Field, PageHeader, buttonClass, inputClass } from "@/components/ui";
import { Flash } from "@/components/flash";
import { createAnnouncementAction, deleteAnnouncementAction } from "@/app/actions/admin";
import type { OneOrMany } from "@/lib/portal";
import { formatDateTime } from "@/lib/format";
import { AUDIENCE_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "الإعلانات" };

export default async function AnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const items = await db.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 50 });

  return (
    <>
      <PageHeader title="الإعلانات" lead="تظهر الإعلانات في لوحة أولياء الأمور أو المعلمين حسب الجمهور المحدد." />
      <Flash params={params} />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-bold">إعلان جديد</h2>
        <form action={createAnnouncementAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-[1fr_14rem]">
            <Field label="العنوان" name="title">
              <input id="title" name="title" required maxLength={120} className={inputClass} />
            </Field>
            <Field label="الجمهور" name="audience">
              <select id="audience" name="audience" defaultValue="ALL" className={inputClass}>
                {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="نص الإعلان" name="body">
            <textarea id="body" name="body" required rows={4} maxLength={2000} className={inputClass} />
          </Field>
          <div>
            <button type="submit" className={buttonClass("primary")}>نشر الإعلان</button>
          </div>
        </form>
      </Card>

      {items.length === 0 ? (
        <EmptyState title="لا توجد إعلانات" />
      ) : (
        <ul className="grid gap-3">
          {items.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-bold">{a.title}</h2>
                    <p className="text-xs text-muted">{formatDateTime(a.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{AUDIENCE_LABELS[a.audience] ?? a.audience}</Badge>
                    <form action={deleteAnnouncementAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="min-h-11 rounded-lg px-3 text-sm text-danger underline" aria-label={`حذف الإعلان ${a.title}`}>
                        حذف
                      </button>
                    </form>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm">{a.body}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
