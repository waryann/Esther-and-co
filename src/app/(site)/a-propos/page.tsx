/* eslint-disable @next/next/no-img-element */
import { PageView } from "@/components/PageView";
import { Photo } from "@/components/Photo";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "À propos | ESTHAIR & CO.", description: "Découvrez l'histoire, la philosophie et l'univers d'ESTHAIR & CO." };

const paragraphs = (t: string) => t.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <>
      <PageView event="page_view" props={{ page: "about" }} />
      <section className="container-page grid items-start gap-8 py-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-16 md:py-16">
        {/* La photo est affichée en entier (aucun recadrage) */}
        {s.aboutImage ? (
          <img src={s.aboutImage} alt="L'équipe ESTHAIR & CO." className="h-auto w-full" />
        ) : (
          <Photo className="aspect-[3/4]" />
        )}
        <div className="md:pt-6">
          {s.aboutEyebrow && (
            <>
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#b98a4d]">{s.aboutEyebrow}</p>
              <div className="mt-4 h-px w-20 bg-[#b98a4d]/60" />
            </>
          )}
          <h1 className="h-display mt-6 text-[34px] leading-[1.15] md:text-[52px]">{s.aboutTitle}</h1>
          <div className="mt-8 space-y-5 text-[14.5px] leading-[1.85] text-[#555] md:text-[15.5px]">
            {paragraphs(s.aboutIntro).map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {s.aboutClosing && <p className="mt-6 text-[15.5px] leading-[1.8] text-[#b98a4d]">{s.aboutClosing}</p>}
        </div>
      </section>

      {(s.aboutStory || s.aboutPhilosophy) && (
        <section className="container-page grid max-w-4xl gap-10 pb-6 md:grid-cols-2">
          {s.aboutStory && (
            <div>
              <h2 className="h-display text-[26px]">Mon histoire</h2>
              <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[#444]">{paragraphs(s.aboutStory).map((p, i) => <p key={i}>{p}</p>)}</div>
            </div>
          )}
          {s.aboutPhilosophy && (
            <div>
              <h2 className="h-display text-[26px]">Ma philosophie</h2>
              <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-[#444]">{paragraphs(s.aboutPhilosophy).map((p, i) => <p key={i}>{p}</p>)}</div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
