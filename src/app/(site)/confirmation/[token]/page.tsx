import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Check } from "lucide-react";
import { ClearBooking } from "@/components/ClearBooking";
import { getBookingByToken } from "@/lib/booking-view";
import { getSettings } from "@/lib/settings";
import { eur } from "@/lib/format";
import { formatDateFr } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Merci pour votre réservation | ESTHAIR & CO.", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b) redirect("/reservation");
  // Page accessible uniquement une fois le paiement confirmé par Stripe.
  if (b.status !== "CONFIRMED" && b.status !== "COMPLETED") redirect(`/paiement/retour/${params.token}`);
  const s = await getSettings();
  const emailConfigured = !!process.env.SMTP_HOST;

  const rows: [string, string][] = [
    ["Service", b.itemName + (b.variantLabel ? ` — ${b.variantLabel}` : "")],
    ["Date", formatDateFr(b.date)],
    ["Heure", b.startTime],
  ];
  if (s.address) rows.push(["Adresse", s.address]);
  rows.push(["Acompte payé", eur(b.depositAmount)], ["Solde à régler sur place", eur(b.remainingAmount)]);

  return (
    <div className="container-page max-w-md py-12 text-center">
      <ClearBooking />
      <span className="mx-auto flex h-16 w-16 animate-check-pop items-center justify-center rounded-full bg-tan text-white"><Check size={30} strokeWidth={2} /></span>
      <h1 className="h-display mt-6 animate-fade-up text-[34px]">Paiement validé</h1>
      <p className="mt-2 animate-fade-up text-[15px] text-[#444]" style={{ animationDelay: "150ms" }}>Votre rendez-vous est confirmé.</p>
      <p className="mx-auto mt-5 max-w-xs animate-fade-up font-serif text-[22px] leading-snug" style={{ animationDelay: "300ms" }}>
        ESTHAIR &amp; CO. vous remercie et vous dit à très bientôt 🤍
      </p>

      <dl className="card mt-8 animate-fade-up divide-y divide-line text-left text-[14px]" style={{ animationDelay: "450ms" }}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-[12px] uppercase tracking-[0.1em] text-taupe">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex items-center justify-center gap-3 bg-sand px-5 py-5 text-left text-[13px] text-[#444]">
        <CalendarCheck size={22} strokeWidth={1.4} className="shrink-0" />
        <span>
          {emailConfigured
            ? "Un email de confirmation avec tous les détails vient de vous être envoyé."
            : "Pensez à noter la date et l'heure de votre rendez-vous."}
        </span>
      </div>

      <Link href="/" className="btn-dark mt-6">RETOUR À L&apos;ACCUEIL</Link>
      <Link href={`/rendez-vous/${params.token}`} className="mt-4 inline-block text-[12.5px] text-taupe underline">Gérer mon rendez-vous</Link>
    </div>
  );
}
