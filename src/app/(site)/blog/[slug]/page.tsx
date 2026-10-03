import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Photo } from "@/components/Photo";
import { PageView } from "@/components/PageView";
import { db } from "@/lib/db";
import { formatDateFr } from "@/lib/time";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const p = await db.blogPost.findUnique({ where: { slug }, include: { category: true } });
  return p && p.status === "PUBLISHED" ? p : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await load(params.slug);
  if (!p) return {};
  return {
    title: `${p.title} | ESTHAIR & CO.`,
    description: p.excerpt || p.content.slice(0, 155),
    openGraph: { type: "article", images: p.coverImage ? [p.coverImage] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const p = await load(params.slug);
  if (!p) notFound();
  const blocks = p.content.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <article className="container-page max-w-2xl py-8 md:py-12">
      <PageView event="page_view" props={{ page: "blog", slug: p.slug }} />
      <Link href="/blog" className="text-[12px] text-taupe">← Blog &amp; conseils</Link>
      <Photo src={p.coverImage} alt={p.title} className="mt-4 aspect-[16/10]" />
      <div className="mt-6 text-[11px] uppercase tracking-[0.14em] text-taupe">
        {p.category?.name} · {p.publishedAt ? formatDateFr(p.publishedAt.toISOString().slice(0, 10), false) : ""} · {p.author}
      </div>
      <h1 className="h-display mt-2 text-[34px] md:text-[42px]">{p.title}</h1>
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#333]">
        {blocks.map((b, i) =>
          b.startsWith("## ") ? (
            <h2 key={i} className="h-display !mt-8 text-[24px]">{b.slice(3)}</h2>
          ) : (
            b.split("\n").map((line, j) => line.startsWith("## ") ? <h2 key={`${i}-${j}`} className="h-display !mt-8 text-[24px]">{line.slice(3)}</h2> : <p key={`${i}-${j}`}>{line}</p>)
          ),
        )}
      </div>
      {p.ctaHref && p.ctaLabel && (
        <div className="mt-10 bg-sand p-6 text-center">
          <p className="font-serif text-[22px]">Vous êtes prête ?</p>
          <Link href={p.ctaHref} className="btn-dark btn-auto mt-4 !px-8">{p.ctaLabel} →</Link>
        </div>
      )}
    </article>
  );
}
