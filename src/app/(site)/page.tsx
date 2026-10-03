import Link from "next/link";
import { ArrowRight, Award, ChevronDown, Globe, Heart, Star } from "lucide-react";
import { Photo } from "@/components/Photo";
import { HeroVideo } from "@/components/HeroVideo";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PageView } from "@/components/PageView";
import { Reveal } from "@/components/Reveal";
import { getSettings } from "@/lib/settings";
import { lines } from "@/lib/format";

export const dynamic = "force-dynamic";

const BADGE_ICONS: Record<string, React.ReactNode> = {
  badge: <Award size={20} strokeWidth={1.3} />,
  globe: <Globe size={20} strokeWidth={1.3} />,
  star: <Star size={20} strokeWidth={1.3} />,
  heart: <Heart size={20} strokeWidth={1.3} />,
};

export default async function HomePage() {
  const s = await getSettings();
  const badges = lines(s.homeBadges).map((l) => {
    const [label, icon] = l.split("|");
    return { label, icon: icon?.trim() || "star" };
  });

  return (
    <>
      <PageView event="page_view" props={{ page: "home" }} />
      <section className="relative">
        <Photo src={s.heroImage} priority className="h-[100svh] min-h-[560px]">
          <HeroVideo sources={s.heroVideo.split(/[,\n]/).map((x) => x.trim()).filter(Boolean)} poster={s.heroImage || undefined} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/70" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-6 pb-8 text-center text-white md:pb-10">
            <h1 style={{ animationDelay: "250ms" }} className="animate-fade-up font-serif text-[34px] font-light uppercase leading-none tracking-[0.06em] min-[400px]:text-[40px] sm:text-[56px] md:text-[84px]">
              ESTHAIR <span className="font-normal">&amp;</span> CO.
            </h1>
            <p style={{ animationDelay: "550ms" }} className="mt-3 animate-fade-up text-[11px] font-light uppercase tracking-[0.3em] md:mt-5 md:text-[14px]">{s.tagline}</p>
            <Link href="/reservation" style={{ animationDelay: "850ms" }} className="btn-tan btn-auto mt-7 animate-fade-up !px-9">
              JE BOOK MA PLACE <ArrowRight size={15} />
            </Link>
            <ChevronDown size={22} strokeWidth={1.3} className="mt-8 animate-bounce opacity-80" aria-hidden />
          </div>
        </Photo>
      </section>

      {/* Newsletter — mobile */}
      <section className="bg-cream px-5 py-5 md:hidden">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em]">Inscrivez-vous à notre newsletter</h2>
        <p className="mb-3 mt-2 text-[12px] leading-snug text-[#555]">
          Soyez les premières informées de nos nouveautés, disponibilités et conseils beauté.
        </p>
        <NewsletterForm variant="bar" />
      </section>

      {/* Newsletter — desktop */}
      <section className="hidden bg-cream md:block">
        <div className="container-page flex items-center justify-between gap-10 py-6">
          <h2 className="h-display shrink-0 text-[24px]">Rejoignez notre newsletter</h2>
          <div className="w-full max-w-[560px]"><NewsletterForm variant="bar" /></div>
        </div>
        <div className="border-t border-line">
          <div className="container-page grid grid-cols-4 gap-6 py-6">
            {badges.map((b, i) => (
              <Reveal key={b.label} delay={i * 100}><div className="flex flex-col items-center gap-2 text-center text-[12px] text-[#444]">
                <span className="text-ink">{BADGE_ICONS[b.icon] ?? BADGE_ICONS.star}</span>
                {b.label}
              </div></Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
