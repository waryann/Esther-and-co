import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { bookingStatusAction, markPaymentRefunded, moveBookingAction, saveBookingNotes } from "@/app/admin/actions";
import { eur } from "@/lib/format";
import { formatDateFr } from "@/lib/time";
import { Badge, Card, Check, Field, Flash, PageHead, Submit, TextArea } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function Action({ id, action, label, danger, notify }: { id: string; action: string; label: string; danger?: boolean; notify?: boolean }) {
  return (
    <form action={bookingStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      {notify && <input type="hidden" name="notify" value="true" />}
      <Submit danger={danger}>{label}</Submit>
    </form>
  );
}

export default async function BookingDetail({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string; error?: string } }) {
  const b = await db.booking.findUnique({
    where: { id: params.id },
    include: { customer: true, options: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!b) notFound();
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex justify-between gap-4 border-b border-line py-2 text-[14px] last:border-0">
      <dt className="text-[12px] uppercase tracking-[0.1em] text-taupe">{k}</dt><dd className="text-right">{v}</dd>
    </div>
  );
  return (
    <>
      <PageHead title={`Rendez-vous ${b.reference}`} sub={`Créé le ${b.createdAt.toLocaleDateString("fr-BE")} · ${b.source === "ADMIN" ? "ajouté manuellement" : "via le site"}`} action={<Badge status={b.status} />} />
      <Flash msg={searchParams.msg} error={searchParams.error} />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Détails">
          <dl>
            {row("Cliente", <Link className="underline" href={`/admin/clients/${b.customerId}`}>{b.customer.name}</Link>)}
            {row("Email", b.customer.email)}
            {row("Téléphone", b.customer.phone)}
            {row("Service", b.itemName)}
            {b.variantLabel && row("Variante", b.variantLabel)}
            {b.options.length > 0 && row("Options", b.options.map((o) => `${o.name} (+${eur(o.price)})`).join(", "))}
            {row("Date", formatDateFr(b.date))}
            {row("Heure", `${b.startTime} – ${b.endTime}`)}
            {row("Total", eur(b.totalAmount))}
            {row("Acompte", eur(b.depositAmount))}
            {row("Solde", eur(b.remainingAmount))}
            {row("Preuve Instagram", b.paymentScreenshotSent ? "Reçue" : "Non reçue")}
            {b.notes && row("Message cliente", b.notes)}
          </dl>
        </Card>

        <div className="space-y-5">
          <Card title="Actions">
            <div className="flex flex-wrap gap-2">
              {b.status !== "CONFIRMED" && b.status !== "COMPLETED" && <Action id={b.id} action="confirm" label="Confirmer" />}
              {b.status === "CONFIRMED" && <Action id={b.id} action="complete" label="Marquer terminé" />}
              {b.status === "CONFIRMED" && <Action id={b.id} action="noshow" label="No-show" danger />}
              {!["CANCELLED", "COMPLETED"].includes(b.status) && <Action id={b.id} action="cancel" label="Annuler (+ email)" danger notify />}
              <Action id={b.id} action="screenshot" label={b.paymentScreenshotSent ? "Preuve : retirer" : "Preuve reçue"} />
            </div>
            <Link href={`/admin/rendez-vous/nouveau?from=${b.id}`} className="mt-4 inline-block text-[12.5px] underline">Réserver à nouveau pour cette cliente →</Link>
          </Card>

          <Card title="Déplacer">
            <form action={moveBookingAction} className="space-y-3">
              <input type="hidden" name="id" value={b.id} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nouvelle date" name="date" type="date" required defaultValue={b.date} />
                <Field label="Nouvelle heure" name="startTime" type="time" required defaultValue={b.startTime} step={900} />
              </div>
              <Check label="Forcer même si le créneau est occupé" name="force" />
              <Submit>Déplacer</Submit>
            </form>
          </Card>

          <Card title="Notes internes">
            <form action={saveBookingNotes} className="space-y-3">
              <input type="hidden" name="id" value={b.id} />
              <TextArea label="" name="adminNotes" defaultValue={b.adminNotes} rows={3} />
              <Submit>Enregistrer</Submit>
            </form>
          </Card>
        </div>

        <Card title="Paiements" className="lg:col-span-2">
          {b.payments.length === 0 ? <p className="text-[13px] text-[#888]">Aucun paiement enregistré.</p> : (
            <ul className="divide-y divide-line">
              {b.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-[13.5px]">
                  <span>{eur(p.amount)} · {p.provider} · <span className="text-[#888]">{p.providerRef || "—"}</span> · {p.paidAt ? p.paidAt.toLocaleString("fr-BE") : p.createdAt.toLocaleString("fr-BE")}</span>
                  <span className="flex items-center gap-3">
                    {p.needsRefund && <span className="text-[12px] font-medium text-red-700">Remboursement à effectuer</span>}
                    <Badge status={p.status} />
                    {p.status === "PAID" && (
                      <form action={markPaymentRefunded}><input type="hidden" name="id" value={p.id} /><button className="text-[12px] underline">Marquer remboursé</button></form>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
