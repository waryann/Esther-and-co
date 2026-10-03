import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.SITE_URL || "http://localhost:3000";
  const [packs, services, posts] = await Promise.all([
    db.package.findMany({ where: { active: true }, select: { slug: true } }),
    db.service.findMany({ where: { active: true }, select: { slug: true } }),
    db.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, publishedAt: true } }),
  ]);
  const fixed = ["", "/reservation", "/packs", "/prestations", "/a-propos", "/blog", "/avis", "/faq", "/contact"];
  return [
    ...fixed.map((p) => ({ url: `${site}${p}` })),
    ...packs.map((p) => ({ url: `${site}/packs/${p.slug}` })),
    ...services.map((s) => ({ url: `${site}/prestations/${s.slug}` })),
    ...posts.map((p) => ({ url: `${site}/blog/${p.slug}`, lastModified: p.publishedAt ?? undefined })),
  ];
}
