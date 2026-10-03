"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Dashboard"],
  ["/admin/calendrier", "Calendrier"],
  ["/admin/rendez-vous", "Rendez-vous"],
  ["/admin/clients", "Clients"],
  ["/admin/packs", "Packs"],
  ["/admin/prestations", "Prestations"],
  ["/admin/options", "Options"],
  ["/admin/disponibilites", "Disponibilités"],
  ["/admin/paiements", "Paiements"],
  ["/admin/avis", "Avis"],
  ["/admin/blog", "Blog"],
  ["/admin/faq", "FAQ"],
  ["/admin/newsletter", "Newsletter"],
  ["/admin/parametres", "Paramètres"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="no-scrollbar flex overflow-x-auto px-2 pb-3 lg:block lg:overflow-visible lg:px-3 lg:pb-0">
      {ITEMS.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`shrink-0 whitespace-nowrap px-3 py-2 text-[13.5px] lg:block ${active ? "bg-white/10 text-white" : "text-white/65 hover:text-white"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
