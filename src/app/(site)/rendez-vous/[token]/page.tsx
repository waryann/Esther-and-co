import Link from "next/link";
import { notFound } from "next/navigation";
import { getBookingByToken } from "@/lib/booking-view";
import { selfServiceAllowed } from "@/lib/booking";
import { getDuration } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";
import { ManageBooking } from "@/components/ManageBooking";
import { eur } from "@/lib/format";
import { formatDateFr } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon rendez-vous | ESTHAIR & CO.", robots: { index: false } };

const STATUS: Record<string, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absence",
  EXPIRED: "Expiré",
  CONFLICT: "En cours de vérification",
};

export default async function ManagePage({ params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b) notFound();
  const [policy, s] = await Promise.all([selfServiceAllowed(b), getSettings()]);
  const itemId = (b.packageId ?? b.serviceId)!;
  const duration = (await getDuration(b.type as "PACKAGE" | "SERVICE", itemId)) ?? b.endMin - b.startMin;

  return (
    <div className="container-page max-w-lg py-10">
      <h1 className="h-display text-center text-[32px]">Mon rendez-vous</h1>
      <p className="mt-2 text-center text-[13px] text-taupe">Réf. {b.reference} · {STATUS[b.status] ?? b.status}</p>

      <dl className="card mt-6 divide-y divide-line text-[14px]">
        {([
          ["Service", b.itemName + (b.variantLabel ? ` — ${b.variantLabel}` : "")],
          ...(b.options.length ? [["Options", b.options.map((o) => o.name).join(", ")]] : []),
          ["Date", formatDateFr(b.date)],
          ["Heure", `${b.startTime} – ${b.endTime}`],
          ...(s.address ? [["Adresse", s.address]] : []),
          ["Total", eur(b.totalAmount)],
          ["Acompte", eur(b.depositAmount)],
          ["Solde restant", eur(b.remainingAmount)],
        ] as [string, string][]).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-[12px] uppercase tracking-[0.1em] text-taupe">{k}</dt>
            <dd className="text-right">{v}</dd>
          </div>
        ))}
      </dl>

      {b.status === "CONFIRMED" && policy.allowed && (
        <ManageBooking token={params.token} type={b.type as "PACKAGE" | "SERVICE"} itemId={itemId} bookingId={b.id} duration={duration} />
      )}
      {b.status === "CONFIRMED" && !policy.allowed && (
        <div className="mt-6 bg-sand p-5 text-[13px] leading-relaxed text-[#444]">
          {policy.configured
            ? "Le délai de modification en ligne est dépassé."
            : "Pour modifier ou annuler votre rendez-vous, merci de nous contacter."}{" "}
          <Link href="/contact" className="underline">Nous contacter</Link>
          {s.depositRefundPolicy && <p className="mt-3"><b>Acompte :</b> {s.depositRefundPolicy}</p>}
        </div>
      )}
      {(b.status === "CANCELLED" || b.status === "EXPIRED") && (
        <Link href="/reservation" className="btn-dark mt-6">RÉSERVER À NOUVEAU</Link>
      )}
    </div>
  );
}
