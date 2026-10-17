import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الأخبار",
  description: "آخر أخبار مدارس النخبة الأهلية: إنجازات الطلاب والأنشطة والإعلانات المدرسية والمناسبات.",
  alternates: { canonical: "/news" },
  openGraph: { title: "أخبار المدرسة", url: "/news" },
};

export default async function NewsPage() {
  const posts = await db.newsPost.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="أخبار المدرسة" lead="تابع أحدث الإنجازات والأنشطة." />
      {posts.length === 0 ? (
        <EmptyState title="لا توجد أخبار منشورة بعد" hint="سنضيف الأخبار هنا فور نشرها." />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Card className="h-full">
                <Badge tone="info">{p.category}</Badge>
                <h2 className="mt-2 text-lg font-bold">
                  <Link href={`/news/${p.slug}`} className="hover:text-brand">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-1 text-xs text-muted">{formatDate(p.publishedAt)}</p>
                <p className="mt-2 text-sm">{p.excerpt}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
