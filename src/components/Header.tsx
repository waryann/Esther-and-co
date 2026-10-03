"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen, CalendarCheck, Home, Info, Mail, Menu, Package, Scissors, ShoppingBag, Star, X, HelpCircle,
} from "lucide-react";
import { InstagramIcon, TikTokIcon } from "./Icons";
import { useBooking } from "./BookingProvider";

const MENU = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/reservation", label: "Réserver", icon: CalendarCheck },
  { href: "/packs", label: "Nos packs", icon: Package },
  { href: "/prestations", label: "Nos prestations", icon: Scissors },
  { href: "/a-propos", label: "À propos", icon: Info },
  { href: "/blog", label: "Blog & conseils", icon: BookOpen },
  { href: "/avis", label: "Avis clientes", icon: Star },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Mail },
];

const DESKTOP = [
  { href: "/", label: "Accueil" },
  { href: "/reservation", label: "Réserver" },
  { href: "/a-propos", label: "À propos" },
  { href: "/blog", label: "Blog" },
  { href: "/avis", label: "Avis" },
  { href: "/contact", label: "Contact" },
];

export function Header({ instagram, tiktok, email }: { instagram: string; tiktok: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const { sel } = useBooking();
  const home = pathname === "/";

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 260);
  };

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const bagHref = sel?.bookingToken
    ? `/reservation/paiement/${sel.bookingToken}`
    : sel?.date && sel.time
    ? "/reservation/informations"
    : sel
    ? "/reservation/date"
    : "/reservation";

  const tone = home ? "text-white" : "text-ink";

  return (
    <>
      <header
        className={`${home ? "absolute inset-x-0 top-0 z-30" : "relative z-30 border-b border-line bg-cream"} ${tone}`}
      >
        <div className="container-page flex h-[58px] items-center justify-between md:h-[68px]">
          <button
            aria-label="Ouvrir le menu"
            onClick={() => setOpen(true)}
            className="-ml-2 flex h-10 w-10 items-center justify-center md:hidden"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <Link
            href="/"
            className="font-serif text-[15px] uppercase tracking-[0.14em] max-md:absolute max-md:left-1/2 max-md:-translate-x-1/2 md:text-[19px]"
          >
            ESTHAIR &amp; CO.
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {DESKTOP.map((l) => (
              <Link key={l.href} href={l.href} className="text-[13px] tracking-wide hover:opacity-70">
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href={bagHref} aria-label="Ma réservation" className="relative -mr-2 flex h-10 w-10 items-center justify-center">
            <ShoppingBag size={21} strokeWidth={1.5} />
            {sel && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-tan" />}
          </Link>
        </div>
      </header>

      {open && (
        <div className={`fixed inset-0 z-50 overflow-y-auto bg-ink text-white transition-all duration-[260ms] ${closing ? "opacity-0 -translate-y-2" : "animate-fade-in"}`} role="dialog" aria-modal="true">
          <div className="container-page flex h-[58px] items-center justify-between md:h-[68px]">
            <span className="font-serif text-[17px] uppercase tracking-[0.14em]">ESTHAIR &amp; CO.</span>
            <button aria-label="Fermer le menu" onClick={close} className="-mr-2 flex h-10 w-10 items-center justify-center transition-transform duration-300 hover:rotate-90">
              <X size={24} strokeWidth={1.4} />
            </button>
          </div>
          <nav className="container-page mt-8 grid gap-x-12 md:grid-cols-2">
            {MENU.map(({ href, label, icon: Icon }, i) => (
              <Link
                key={href}
                href={href}
                style={{ animationDelay: `${120 + i * 55}ms` }}
                className="group flex animate-slide-in items-center gap-5 border-b border-white/5 py-[17px] text-[16px] transition-all duration-300 hover:translate-x-1.5 hover:text-tan"
              >
                <Icon size={19} strokeWidth={1.4} className="text-white/80 transition-colors group-hover:text-tan" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="container-page mt-8 flex animate-fade-up items-center gap-6 border-t border-white/10 pt-6 pb-10" style={{ animationDelay: "650ms" }}>
            <a href={`https://instagram.com/${instagram}`} aria-label="Instagram" target="_blank" rel="noreferrer"><InstagramIcon /></a>
            {tiktok && <a href={tiktok} aria-label="TikTok" target="_blank" rel="noreferrer"><TikTokIcon /></a>}
            <Link href={email ? `mailto:${email}` : "/contact"} aria-label="Contact"><Mail size={20} strokeWidth={1.5} /></Link>
            <Link href="/reservation" className="btn-tan btn-auto ml-auto hidden md:inline-flex">JE BOOK MA PLACE</Link>
          </div>
        </div>
      )}
    </>
  );
}
