import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";
import { eur } from "@/lib/format";

type PackLite = { slug: string; name: string; image: string; fromPrice: number; hasVariants: boolean; shortDescription: string };
type ServiceLite = { slug: string; name: string; image: string; price: number; priceFrom: boolean };

const priceLabel = (price: number, from: boolean) => (from ? `À partir de ${eur(price)}` : eur(price));

/** Mobile : carte photo avec texte en overlay. Desktop : carte haute + bouton CHOISIR. */
export function PackCard({ p, desktop = false, i = 0 }: { p: PackLite; desktop?: boolean; i?: number }) {
  const price = p.hasVariants ? `À partir de ${eur(p.fromPrice)}` : eur(p.fromPrice);
  if (desktop) {
    return (
      <Reveal delay={i * 110} className="h-full"><div className="flex h-full flex-col bg-white transition-shadow duration-500 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,.35)]">
        <Link href={`/packs/${p.slug}`}>
          <Photo src={p.image} alt={p.name} className="aspect-[3/4]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-center font-serif text-[22px] leading-tight text-white">{p.name}</div>
          </Photo>
        </Link>
        <div className="flex flex-1 flex-col items-center gap-1 px-4 pb-4 pt-3 text-center">
          <div className="text-[12px] text-[#666]">{p.shortDescription || "Mèches + prestation incluses"}</div>
          <div className="text-[13px]">{price}</div>
          <Link href={`/packs/${p.slug}`} className="btn-dark mt-3">CHOISIR</Link>
        </div>
      </div></Reveal>
    );
  }
  return (
    <Reveal delay={i * 110}><Link href={`/packs/${p.slug}`} className="block">
      <Photo src={p.image} alt={p.name} className="aspect-[4/3]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <div className="font-serif text-[21px] leading-[1.05]">{p.name}</div>
          <div className="mt-1 text-[11px] opacity-90">{price}</div>
        </div>
        <ChevronRight size={16} className="absolute bottom-3 right-3 text-white transition-transform duration-300 group-hover/photo:translate-x-1" />
      </Photo>
    </Link></Reveal>
  );
}

export function ServiceCard({ s, desktop = false, i = 0 }: { s: ServiceLite; desktop?: boolean; i?: number }) {
  if (desktop) {
    return (
      <Reveal delay={i * 80} className="h-full"><div className="flex h-full flex-col bg-white transition-shadow duration-500 hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,.35)]">
        <Link href={`/prestations/${s.slug}`}>
          <Photo src={s.image} alt={s.name} className="aspect-[3/4]" />
        </Link>
        <div className="flex flex-1 flex-col items-center px-3 pb-3 pt-3 text-center">
          <div className="text-[13px]">{s.name}</div>
          <div className="mt-0.5 text-[11.5px] text-[#777]">{priceLabel(s.price, s.priceFrom)}</div>
          <Link href={`/prestations/${s.slug}`} className="btn-outline mt-3 !border-line !py-2.5 !text-[11px] hover:!border-ink">VOIR PLUS</Link>
        </div>
      </div></Reveal>
    );
  }
  return (
    <Reveal delay={(i % 3) * 90}><Link href={`/prestations/${s.slug}`} className="block border border-line bg-white">
      <Photo src={s.image} alt={s.name} className="aspect-[3/4]" />
      <div className="px-1.5 py-2 text-center">
        <div className="min-h-[2.4em] text-[10.5px] leading-tight">{s.name}</div>
        <div className="mt-1 text-[9.5px] text-[#777]">{priceLabel(s.price, s.priceFrom)}</div>
      </div>
    </Link></Reveal>
  );
}
