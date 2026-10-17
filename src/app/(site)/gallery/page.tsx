import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "معرض الصور",
  description: "لقطات من الحياة المدرسية في مدارس النخبة الأهلية: الأنشطة والمختبرات والرحلات والمناسبات الوطنية.",
  alternates: { canonical: "/gallery" },
  openGraph: { title: "معرض الصور", url: "/gallery" },
};

export default async function GalleryPage() {
  const items = await db.galleryItem.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] });
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="معرض الصور" lead="لقطات من الحياة المدرسية والأنشطة الطلابية." />
      {items.length === 0 ? (
        <EmptyState title="لا توجد صور بعد" hint="سنضيف لقطات المناسبات قريباً." />
      ) : (
        categories.map((cat) => (
          <section key={cat} className="mb-8" aria-label={cat}>
            <h2 className="mb-3 text-xl font-bold text-brand">{cat}</h2>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items
                .filter((i) => i.category === cat)
                .map((i) => (
                  <li key={i.id} className="min-w-0 overflow-hidden rounded-xl border border-line bg-surface">
                    <div
                      role="img"
                      aria-label={i.caption}
                      className="aspect-[4/3] w-full"
                      style={{
                        background: `linear-gradient(135deg, hsl(${i.hue} 55% 38%), hsl(${(i.hue + 40) % 360} 60% 62%))`,
                      }}
                    />
                    <div className="p-4">
                      <Badge tone="info">{i.category}</Badge>
                      <h3 className="mt-2 font-bold">{i.title}</h3>
                      <p className="text-sm text-muted">{i.caption}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
