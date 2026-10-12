import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductDetail } from "@/components/ProductDetail";
import { PageView } from "@/components/PageView";
import { getOptionsFor, getServiceBySlug } from "@/lib/catalog";
import { lines, parseInfoNotes, withDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getServiceBySlug(params.slug);
  if (!s) return {};
  return {
    title: s.seoTitle || `${s.name} | ESTHAIR & CO.`,
    description: s.seoDescription || s.description.slice(0, 155),
    openGraph: s.image ? { images: [s.image] } : undefined,
  };
}

export default async function ServicePage({ params }: { params: { slug: string } }) {
  const [svc, options] = await Promise.all([getServiceBySlug(params.slug), getOptionsFor("SERVICE")]);
  if (!svc) notFound();
  return (
    <>
      <PageView event="page_view" props={{ page: "service", slug: svc.slug }} />
      <ProductDetail
        kind="SERVICE"
        id={svc.id}
        slug={svc.slug}
        name={svc.name}
        image={svc.image}
        description={svc.description}
        features={lines(withDuration(svc.features, svc.durationMinutes).replace(/\|/g, "\n"))}
        infoNotes={parseInfoNotes(withDuration(svc.infoNotes, svc.durationMinutes))}
        variants={[]}
        basePrice={svc.price}
        priceFrom={svc.priceFrom}
        coloration={null}
        hasOptions={options.length > 0}
      />
    </>
  );
}
