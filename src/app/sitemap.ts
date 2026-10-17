import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { STAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const SITE = process.env.SITE_URL ?? "http://localhost:3114";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const news = await db.newsPost.findMany({ select: { slug: true, publishedAt: true } }).catch(() => []);
  const fixed = ["", "/about", "/stages", "/admissions", "/admissions/apply", "/admissions/status", "/news", "/events", "/gallery", "/contact"];
  return [
    ...fixed.map((p) => ({ url: `${SITE}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...STAGES.map((s) => ({ url: `${SITE}/stages/${s.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...news.map((n) => ({ url: `${SITE}/news/${n.slug}`, lastModified: n.publishedAt, priority: 0.5 })),
  ];
}
