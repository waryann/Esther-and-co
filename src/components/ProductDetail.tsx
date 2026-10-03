"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Photo } from "./Photo";
import { FeatureRow } from "./FeatureIcon";
import { useBooking } from "./BookingProvider";
import { track } from "@/lib/client";
import { eur } from "@/lib/format";

type Variant = { id: string; label: string; price: number };
type Coloration = { id: string; price: number } | null;

export type ProductDetailProps = {
  kind: "PACKAGE" | "SERVICE";
  id: string;
  slug: string;
  name: string;
  image: string;
  description: string;
  features: string[];
  variants: Variant[];
  basePrice: number;
  priceFrom: boolean;
  coloration: Coloration;
  hasOptions: boolean;
};

export function ProductDetail(p: ProductDetailProps) {
  const router = useRouter();
  const { start } = useBooking();
  const [variantId, setVariantId] = useState<string | null>(p.variants[0]?.id ?? null);
  const [color, setColor] = useState(false);

  const variant = p.variants.find((v) => v.id === variantId) ?? null;
  const total = useMemo(
    () => (variant ? variant.price : p.basePrice) + (color && p.coloration ? p.coloration.price : 0),
    [variant, color, p.basePrice, p.coloration],
  );

  function go() {
    start({
      type: p.kind,
      itemId: p.id,
      itemSlug: p.slug,
      itemName: p.name,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? "",
      optionIds: color && p.coloration ? [p.coloration.id] : [],
    });
    track(p.kind === "PACKAGE" ? "package_selected" : "service_selected", { slug: p.slug, variant: variant?.label });
    router.push(p.hasOptions ? "/reservation/options" : "/reservation/date");
  }

  const isPack = p.kind === "PACKAGE";
  const back = isPack ? "/packs" : "/prestations";

  return (
    <div className="md:container-page md:grid md:grid-cols-2 md:gap-10 md:py-10">
      <div className="relative">
        <Photo src={p.image} alt={p.name} priority className="aspect-square md:aspect-[4/5]" />
        <Link href={back} aria-label="Retour" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 md:hidden">
          <ArrowLeft size={17} />
        </Link>
      </div>

      <div className="-mt-6 rounded-t-[22px] bg-cream px-5 pb-28 pt-6 md:mt-0 md:rounded-none md:px-0 md:pb-0 md:pt-2">
        <Link href={back} className="mb-3 hidden items-center gap-1 text-[12px] text-taupe md:inline-flex"><ArrowLeft size={14} /> Retour</Link>
        <h1 className="h-display animate-fade-up text-[32px] md:text-[40px]">{p.name}</h1>
        <p className="mt-1 text-[14px]">
          {isPack || p.priceFrom ? "À partir de " : ""}
          <span className="font-medium">{eur(isPack ? Math.min(...(p.variants.length ? p.variants.map((v) => v.price) : [p.basePrice])) : p.basePrice)}</span>
        </p>
        {isPack && <p className="mt-1 font-serif text-[17px] text-[#555] md:hidden">Mèches + prestation incluses</p>}
        <p className="mt-3 text-[13.5px] leading-relaxed text-[#444]">{p.description}</p>

        <FeatureRow features={p.features} />

        {p.variants.length > 0 && (
          <fieldset className="mt-1">
            <legend className="mb-3 text-[13.5px]">Choisissez votre longueur :</legend>
            <div className="space-y-2">
              {p.variants.map((v, i) => (
                <label
                  key={v.id}
                  style={{ animationDelay: `${300 + i * 70}ms` }}
                  className={`flex animate-fade-up cursor-pointer items-center justify-between border bg-white px-4 py-3.5 text-[14px] transition-colors ${variantId === v.id ? "border-ink" : "border-line"}`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="variant" className="peer sr-only" checked={variantId === v.id} onChange={() => setVariantId(v.id)} />
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${variantId === v.id ? "border-ink" : "border-[#bbb]"}`}>
                      {variantId === v.id && <span className="h-2 w-2 rounded-full bg-ink" />}
                    </span>
                    {v.label}
                  </span>
                  <span>{eur(v.price)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {p.coloration && (
          <fieldset className="mt-6 hidden md:block">
            <legend className="mb-3 text-[13.5px]">Souhaitez-vous une coloration ?</legend>
            <div className="space-y-2 text-[13.5px]">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="radio" name="color" checked={!color} onChange={() => setColor(false)} /> Non, pas de coloration
              </label>
              <label className="flex cursor-pointer items-center gap-3">
                <input type="radio" name="color" checked={color} onChange={() => setColor(true)} /> Oui, ajout d&apos;une coloration (+{eur(p.coloration.price)})
              </label>
            </div>
          </fieldset>
        )}

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 px-5 py-3 backdrop-blur md:static md:z-auto md:mt-6 md:border-0 md:bg-transparent md:p-0">
          {variant && (
            <div className="mb-2 flex items-baseline justify-between text-[13px] md:hidden">
              <span className="text-[#666]">{variant.label}</span>
              <span className="font-medium">{eur(total)}</span>
            </div>
          )}
          <button onClick={go} className="btn-dark">
            {isPack ? "CONTINUER" : "CHOISIR CETTE PRESTATION"} <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
