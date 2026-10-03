import Link from "next/link";
import { InstagramIcon, TikTokIcon } from "./Icons";
import { getSettings } from "@/lib/settings";

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="mt-20 border-t border-line bg-cream">
      <div className="container-page grid gap-8 py-10 md:grid-cols-3">
        <div>
          <div className="font-serif text-lg uppercase tracking-[0.14em]">ESTHAIR &amp; CO.</div>
          <p className="mt-2 text-[13px] text-taupe">{s.tagline}</p>
          <div className="mt-4 flex items-center gap-4 text-ink">
            <a href={`https://instagram.com/${s.instagramHandle}`} target="_blank" rel="noreferrer" aria-label="Instagram"><InstagramIcon size={19} /></a>
            {s.tiktokUrl && <a href={s.tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok"><TikTokIcon size={19} /></a>}
          </div>
        </div>
        <nav className="grid grid-cols-2 gap-2 text-[14px]">
          <Link href="/reservation">Réserver</Link>
          <Link href="/packs">Nos packs</Link>
          <Link href="/prestations">Nos prestations</Link>
          <Link href="/a-propos">À propos</Link>
          <Link href="/blog">Blog &amp; conseils</Link>
          <Link href="/avis">Avis clientes</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <p className="text-[12px] leading-relaxed text-taupe">
          © {new Date().getFullYear()} ESTHAIR &amp; CO. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
