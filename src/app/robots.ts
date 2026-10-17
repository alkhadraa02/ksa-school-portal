import type { MetadataRoute } from "next";

const SITE = process.env.SITE_URL ?? "http://localhost:3114";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/teacher", "/parent", "/api/", "/login"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
