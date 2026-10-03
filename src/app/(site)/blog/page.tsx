import Link from "next/link";
import { Photo } from "@/components/Photo";
import { db } from "@/lib/db";
import { Reveal } from "@/components/Reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog & conseils | ESTHAIR & CO.", description: "Nos articles pour prendre soin de vos cheveux et faire les meilleurs choix." };

export default async function BlogPage({ searchParams }: { searchParams: { cat?: string } }) {
  const [cats, posts] = await Promise.all([
    db.blogCategory.findMany({ orderBy: { id: "asc" } }),
    db.blogPost.findMany({
      where: { status: "PUBLISHED", category: searchParams.cat ? { slug: searchParams.cat } : undefined },
      orderBy: { publishedAt: "desc" },
      include: { category: true },
    }),
  ]);
  const chip = (active: boolean) =>
    `shrink-0 border px-4 py-2 text-[11.5px] ${active ? "border-ink bg-ink text-white" : "border-line bg-white"}`;
  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="page-title !normal-case">Blog &amp; conseils</h1>
      <p className="mx-auto mt-3 max-w-md text-center text-[13px] text-[#555]">
        Découvrez nos articles pour prendre soin de vos cheveux et faire les meilleurs choix.
      </p>
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto md:justify-center">
        <Link href="/blog" className={chip(!searchParams.cat)}>Tous</Link>
        {cats.map((c) => <Link key={c.id} href={`/blog?cat=${c.slug}`} className={chip(searchParams.cat === c.slug)}>{c.name}</Link>)}
      </div>
      {posts.length === 0 && <p className="mt-10 text-center text-[13px] text-[#777]">Aucun article pour le moment.</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 90} className="h-full"><article className="flex h-full flex-col bg-white">
            <Link href={`/blog/${p.slug}`}><Photo src={p.coverImage} alt={p.title} className="aspect-[16/10]" /></Link>
            <div className="flex flex-1 flex-col p-3">
              <h2 className="text-[13px] leading-snug">{p.title}</h2>
              <Link href={`/blog/${p.slug}`} className="mt-3 border border-line px-3 py-2 text-center text-[10.5px] uppercase tracking-[0.12em] hover:border-ink md:mt-auto">
                Lire l&apos;article →
              </Link>
            </div>
          </article></Reveal>
        ))}
      </div>
    </div>
  );
}
