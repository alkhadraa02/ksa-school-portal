import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "تقويم الفعاليات",
  description: "تقويم فعاليات مدارس النخبة الأهلية: الاجتماعات واللقاءات والأنشطة والمناسبات الوطنية والمسابقات.",
  alternates: { canonical: "/events" },
  openGraph: { title: "تقويم الفعاليات", url: "/events" },
};

const MONTH = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { timeZone: "Asia/Riyadh", month: "long", year: "numeric" });

export default async function EventsPage() {
  const now = new Date();
  const [upcoming, past] = await Promise.all([
    db.schoolEvent.findMany({ where: { startsAt: { gte: now } }, orderBy: { startsAt: "asc" } }),
    db.schoolEvent.findMany({ where: { startsAt: { lt: now } }, orderBy: { startsAt: "desc" }, take: 6 }),
  ]);

  const groups = new Map<string, typeof upcoming>();
  for (const e of upcoming) {
    const key = MONTH.format(e.startsAt);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="تقويم الفعاليات" lead="مواعيد الأنشطة والمناسبات المدرسية." />
      {upcoming.length === 0 ? (
        <EmptyState title="لا توجد فعاليات قادمة" hint="سيُعلن عن الفعاليات الجديدة هنا." />
      ) : (
        [...groups.entries()].map(([month, items]) => (
          <section key={month} className="mb-8" aria-label={month}>
            <h2 className="mb-3 text-xl font-bold text-brand">{month}</h2>
            <ul className="grid gap-3 md:grid-cols-2">
              {items.map((e) => (
                <li key={e.id}>
                  <Card className="h-full">
                    <Badge tone="warning">{e.category}</Badge>
                    <h3 className="mt-2 font-bold">{e.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatDateTime(e.startsAt)} · {e.location}
                    </p>
                    <p className="mt-2 text-sm">{e.description}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      {past.length > 0 ? (
        <section aria-label="فعاليات سابقة">
          <h2 className="mb-3 text-xl font-bold">فعاليات سابقة</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {past.map((e) => (
              <li key={e.id}>
                <Card className="h-full">
                  <h3 className="font-medium">{e.title}</h3>
                  <p className="text-sm text-muted">{formatDateTime(e.startsAt)}</p>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
