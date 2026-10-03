"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";
import { NewsletterForm } from "./NewsletterForm";

const KEY = "esthair_newsletter_seen";

/** Affiché une seule fois (localStorage) à la première visite, jamais sur l'admin ni pendant le paiement. */
export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const quiet = /^\/(reservation\/|paiement|confirmation|rendez-vous)/.test(pathname);

  useEffect(() => {
    if (quiet) return;
    try {
      if (localStorage.getItem(KEY) || localStorage.getItem("esthair_newsletter")) return;
    } catch {
      return;
    }
    const t = setTimeout(() => setOpen(true), 1800);
    return () => clearTimeout(t);
  }, [quiet]);

  function close() {
    setOpen(false);
    try { localStorage.setItem(KEY, "1"); } catch {}
  }

  if (!open || quiet) return null;
  return (
    <div className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-black/70 px-5" role="dialog" aria-modal="true" aria-labelledby="nl-title">
      <div className="relative w-full max-w-[420px] animate-pop bg-cream px-7 py-9 text-center">
        <button onClick={close} aria-label="Fermer" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center">
          <X size={18} />
        </button>
        <Mail size={22} strokeWidth={1.4} className="mx-auto mb-4" />
        <h2 id="nl-title" className="h-display text-[26px]">Rejoignez notre newsletter</h2>
        <p className="mx-auto mt-4 max-w-[300px] text-[13.5px] leading-relaxed text-[#444]">
          Soyez les premières informées : nouveaux services, disponibilités, offres exclusives et conseils beauté.
        </p>
        <div className="mt-6 text-left">
          <NewsletterForm variant="stack" onDone={() => setTimeout(close, 2200)} />
        </div>
      </div>
    </div>
  );
}
