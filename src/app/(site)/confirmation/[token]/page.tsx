import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, Check } from "lucide-react";
import { ClearBooking } from "@/components/ClearBooking";
import { InstagramIcon } from "@/components/Icons";
import { ScreenshotButton } from "@/components/InstructionsActions";
import { getBookingByToken } from "@/lib/booking-view";
import { getSettings } from "@/lib/settings";
import { eur } from "@/lib/format";
import { formatDateFr } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Confirmation | ESTHAIR & CO.", robots: { index: false } };

export default async function ConfirmationPage({ params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b) redirect("/reservation");
  // Une réservation n'est confirmée que lorsque le backend a reçu la confirmation du paiement.
  if (b.status !== "CONFIRMED" && b.status !== "COMPLETED") redirect(`/paiement/retour/${params.token}`);
  const s = await getSettings();

  const rows: [string, string][] = [
    ["Service", b.itemName + (b.variantLabel ? ` — ${b.variantLabel}` : "")],
    ["Date", formatDateFr(b.date)],
    ["Heure", b.startTime],
  ];
  if (s.address) rows.push(["Adresse", s.address]);
  rows.push(["Acompte payé", eur(b.depositAmount)], ["Solde restant", eur(b.remainingAmount)]);

  return (
    <div className="container-page max-w-md py-12 text-center">
      <ClearBooking />
      <span className="mx-auto flex h-14 w-14 animate-check-pop items-center justify-center rounded-full bg-tan/80 text-white"><Check size={26} /></span>
      <h1 className="h-display mt-5 text-[32px]">Merci pour votre réservation !</h1>
      <p className="mt-3 text-[14px] text-[#444]">Votre rendez-vous est confirmé.</p>
      <p className="mx-auto mt-3 max-w-xs text-[13.5px] leading-relaxed text-[#444]">
        Un email de confirmation vient de vous être envoyé avec tous les détails.
      </p>

      <dl className="card mt-6 divide-y divide-line text-left text-[14px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-[12px] uppercase tracking-[0.1em] text-taupe">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>

      {!b.paymentScreenshotSent && (
        <div className="mt-6 bg-sand p-5 text-left">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider"><InstagramIcon size={18} /> Important</div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#444]">
            Merci d&apos;envoyer une capture d&apos;écran de la preuve de paiement sur Instagram <b>@{s.instagramHandle}</b> afin que nous puissions valider votre réservation.
          </p>
          <div className="mt-4"><ScreenshotButton token={params.token} /></div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3 bg-sand px-5 py-5 text-[13px] text-[#444]">
        <CalendarCheck size={22} strokeWidth={1.4} className="shrink-0" />
        <span>Nous avons hâte de vous accueillir chez ESTHAIR &amp; CO. 🤍</span>
      </div>

      <Link href="/" className="btn-dark mt-6">RETOUR À L&apos;ACCUEIL</Link>
      <Link href={`/rendez-vous/${params.token}`} className="mt-4 inline-block text-[12.5px] text-taupe underline">Gérer mon rendez-vous</Link>
    </div>
  );
}
