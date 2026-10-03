import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetail } from "@/components/ProductDetail";
import { PageView } from "@/components/PageView";
import { getOptionsFor, getPackageBySlug } from "@/lib/catalog";
import { lines } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPackageBySlug(params.slug);
  if (!p) return {};
  return {
    title: p.seoTitle || `${p.name} | ESTHAIR & CO.`,
    description: p.seoDescription || p.description.slice(0, 155),
    openGraph: p.image ? { images: [p.image] } : undefined,
  };
}

export default async function PackPage({ params }: { params: { slug: string } }) {
  const [pack, options] = await Promise.all([getPackageBySlug(params.slug), getOptionsFor("PACKAGE")]);
  if (!pack) notFound();
  const coloration = options.find((o) => o.name.toLowerCase().startsWith("coloration"));
  return (
    <>
      <PageView event="page_view" props={{ page: "pack", slug: pack.slug }} />
      <ProductDetail
        kind="PACKAGE"
        id={pack.id}
        slug={pack.slug}
        name={pack.name}
        image={pack.image}
        description={pack.description}
        features={lines(pack.features.replace(/\|/g, "\n"))}
        variants={pack.variants.map((v) => ({ id: v.id, label: v.label, price: v.price }))}
        basePrice={pack.basePrice}
        priceFrom
        coloration={coloration ? { id: coloration.id, price: coloration.priceModifier } : null}
        hasOptions={options.length > 0}
      />
    </>
  );
}
