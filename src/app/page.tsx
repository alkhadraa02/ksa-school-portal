import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { SiteShell } from "@/components/site-shell";
import { Card, LinkButton, Badge } from "@/components/ui";
import { SCHOOL_NAME, SCHOOL_ADDRESS, SCHOOL_PHONE, SCHOOL_EMAIL, STAGES } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `${SCHOOL_NAME} | من رياض الأطفال إلى الثانوية` },
  description:
    "مدارس أهلية في الرياض تقدم تعليماً متميزاً من رياض الأطفال حتى الثانوية، مع بوابة إلكترونية لأولياء الأمور والمعلمين وتقديم التحاق عبر الإنترنت.",
  alternates: { canonical: "/" },
  openGraph: { title: SCHOOL_NAME, description: "تعليم متميز وبيئة آمنة وتواصل مستمر مع أولياء الأمور.", url: "/" },
};

export default async function HomePage() {
  const [news, events, studentCount] = await Promise.all([
    db.newsPost.findMany({ orderBy: { publishedAt: "desc" }, take: 3 }),
    db.schoolEvent.findMany({ where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 3 }),
    db.student.count({ where: { status: "ACTIVE" } }),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: SCHOOL_NAME,
    address: SCHOOL_ADDRESS,
    telephone: SCHOOL_PHONE,
    email: SCHOOL_EMAIL,
    url: process.env.SITE_URL ?? "http://localhost:3114",
  };

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="bg-brand text-brand-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <h1 className="max-w-3xl text-3xl font-bold leading-snug md:text-5xl">
            نبني جيلاً واثقاً، متمسكاً بقيمه، ومستعداً للمستقبل
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-soft">
            {SCHOOL_NAME}: تعليم أهلي متميز من رياض الأطفال حتى الثانوية، بمعلمين مؤهلين وبيئة آمنة وتواصل يومي مع أولياء الأمور.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/admissions/apply"
              className="inline-flex min-h-11 items-center rounded-lg bg-surface px-6 font-medium text-brand hover:bg-brand-soft"
            >
              قدّم طلب التحاق
            </Link>
            <Link
              href="/admissions/status"
              className="inline-flex min-h-11 items-center rounded-lg border border-brand-soft px-6 font-medium text-brand-ink hover:bg-ink"
            >
              متابعة حالة الطلب
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="stages-h">
        <h2 id="stages-h" className="text-2xl font-bold">
          المراحل الدراسية
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STAGES.map((s) => (
            <Card key={s.key}>
              <h3 className="text-lg font-bold text-brand">{s.label}</h3>
              <p className="mt-1 text-xs text-muted">{s.ages}</p>
              <p className="mt-2 text-sm">{s.summary}</p>
              <Link href={`/stages/${s.slug}`} className="mt-3 inline-block text-sm font-medium text-brand underline">
                التفاصيل
              </Link>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">يتعلم لدينا حالياً {studentCount} طالباً وطالبة.</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-6 md:grid-cols-2" aria-label="الأخبار والفعاليات">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">آخر الأخبار</h2>
            <Link href="/news" className="text-sm text-brand underline">
              كل الأخبار
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {news.map((n) => (
              <li key={n.id}>
                <Card>
                  <Badge tone="info">{n.category}</Badge>
                  <h3 className="mt-2 font-bold">
                    <Link href={`/news/${n.slug}`} className="hover:text-brand">
                      {n.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-muted">{formatDate(n.publishedAt)}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">الفعاليات القادمة</h2>
            <Link href="/events" className="text-sm text-brand underline">
              التقويم كاملاً
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {events.length === 0 ? (
              <li className="text-sm text-muted">لا توجد فعاليات قادمة حالياً.</li>
            ) : (
              events.map((e) => (
                <li key={e.id}>
                  <Card>
                    <h3 className="font-bold">{e.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {formatDate(e.startsAt)} · {e.location}
                    </p>
                  </Card>
                </li>
              ))
            )}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-brand-soft">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">التسجيل مفتوح للعام {new Date().getFullYear()}</h2>
            <p className="mt-1 text-muted">املأ النموذج في دقائق وسيتواصل معك قسم القبول.</p>
          </div>
          <LinkButton href="/admissions/apply">ابدأ التقديم</LinkButton>
        </Card>
      </section>
    </SiteShell>
  );
}
