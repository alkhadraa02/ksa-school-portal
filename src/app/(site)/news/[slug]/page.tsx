import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { SCHOOL_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await db.newsPost.findUnique({ where: { slug } });
  if (!post) return { title: "الخبر غير موجود" };
  return {
    title: post.title.slice(0, 60),
    description: post.excerpt.slice(0, 158),
    alternates: { canonical: `/news/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt.slice(0, 158), url: `/news/${post.slug}` },
  };
}

export default async function NewsPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await db.newsPost.findUnique({ where: { slug } });
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    datePublished: post.publishedAt.toISOString(),
    description: post.excerpt,
    inLanguage: "ar",
    publisher: { "@type": "Organization", name: SCHOOL_NAME },
  };

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/news" className="text-sm text-brand underline">
        العودة إلى الأخبار
      </Link>
      <div className="mt-4">
        <Badge tone="info">{post.category}</Badge>
      </div>
      <h1 className="mt-2 text-3xl font-bold leading-snug">{post.title}</h1>
      <p className="mt-1 text-sm text-muted">{formatDate(post.publishedAt)}</p>
      <div className="mt-6 space-y-4 leading-8">
        {post.body.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
