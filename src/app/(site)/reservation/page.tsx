import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Photo } from "@/components/Photo";
import { PackCard, ServiceCard } from "@/components/Cards";
import { PageView } from "@/components/PageView";
import { Reveal } from "@/components/Reveal";
import { getActivePackages, getActiveServices } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Réserver votre rendez-vous | ESTHAIR & CO.", description: "Choisissez un pack ou une prestation et réservez en ligne." };

export default async function ReservationPage({ searchParams }: { searchParams: { tab?: string } }) {
  const [packs, services, settings] = await Promise.all([getActivePackages(), getActiveServices(), getSettings()]);
  const tab = searchParams.tab === "prestations" ? "prestations" : searchParams.tab === "packs" ? "packs" : null;
  const desktopTab = tab ?? "packs";

  return (
    <div className="container-page py-8 md:py-12">
      <PageView event="reservation_started" />
      <h1 className="page-title">
        Réserver votre
        <br className="md:hidden" /> rendez-vous
      </h1>
      <p className="mt-3 text-center text-[13px] text-[#555] md:text-[14px]">
        <span className="md:hidden">Choisissez la catégorie qui vous correspond.</span>
        <span className="hidden md:inline">Choisissez la prestation qui vous correspond.</span>
      </p>

      <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 text-center text-[11.5px] font-medium uppercase tracking-[0.14em]">
        {(
          [
            ["packs", "Nos packs"],
            ["prestations", "Nos prestations"],
          ] as const
        ).map(([key, label]) => {
          const active = (tab ?? "packs") === key;
          return (
            <Link
              key={key}
              href={`/reservation?tab=${key}`}
              className={`border-b py-3.5 ${active ? "border-ink bg-beige" : "border-line bg-sand/40 text-[#555]"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Mobile */}
      <div className="mt-4 md:hidden">
        {!tab && (
          <div className="space-y-3">
            <Reveal><CategoryCard href="/reservation?tab=packs" title="Nos packs" sub="Mèches + prestation incluses" image={settings.reservationPacksImage} /></Reveal>
            <Reveal delay={120}><CategoryCard href="/reservation?tab=prestations" title="Nos prestations" sub="Pose, tissage, perruque..." image={settings.reservationServicesImage} /></Reveal>
          </div>
        )}
        {tab === "packs" && (
          <div className="space-y-3">{packs.map((p, i) => <PackCard key={p.id} p={p} i={i} />)}</div>
        )}
        {tab === "prestations" && (
          <div className="grid grid-cols-3 gap-2">{services.map((s, i) => <ServiceCard key={s.id} s={s} i={i} />)}</div>
        )}
      </div>

      {/* Desktop */}
      <div className="mt-6 hidden md:block">
        {desktopTab === "packs" ? (
          <div className="grid grid-cols-3 gap-5">{packs.map((p, i) => <PackCard key={p.id} p={p} desktop i={i} />)}</div>
        ) : (
          <div className="grid grid-cols-3 gap-5 lg:grid-cols-6">{services.map((s, i) => <ServiceCard key={s.id} s={s} desktop i={i} />)}</div>
        )}
      </div>
    </div>
  );
}

function CategoryCard({ href, title, sub, image }: { href: string; title: string; sub: string; image?: string }) {
  return (
    <Link href={href} className="block">
      <Photo src={image} className="aspect-[16/9]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-4 text-white">
          <div className="font-serif text-[21px]">{title}</div>
          <div className="text-[11px] opacity-90">{sub}</div>
        </div>
        <ChevronRight size={16} className="absolute bottom-3 right-3 text-white" />
      </Photo>
    </Link>
  );
}
