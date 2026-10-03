import { db } from "@/lib/db";
import { createBookingAction } from "@/app/admin/actions";
import { Card, Check, Field, Flash, PageHead, Select, Submit, TextArea } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewBookingPage({ searchParams }: { searchParams: { from?: string; customerId?: string; msg?: string; error?: string } }) {
  const [packs, services, options] = await Promise.all([
    db.package.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, include: { variants: { where: { active: true }, orderBy: { sortOrder: "asc" } } } }),
    db.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.serviceOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  // Rebooking : reprend la dernière sélection, mais prix / options / disponibilité sont revalidés à l'enregistrement.
  const from = searchParams.from
    ? await db.booking.findUnique({ where: { id: searchParams.from }, include: { customer: true, options: true } })
    : null;
  const cust = from?.customer ?? (searchParams.customerId ? await db.customer.findUnique({ where: { id: searchParams.customerId } }) : null);
  const fromItem = from ? `${from.type}:${from.packageId ?? from.serviceId}` : "";

  return (
    <>
      <PageHead title="Nouveau rendez-vous" sub="Pour les rendez-vous pris par Instagram / DM. Le créneau est bloqué automatiquement dans le calendrier public." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      {from && <p className="mb-4 border border-tan bg-beige/40 px-4 py-3 text-[13px]">Réservation à nouveau : les prix actuels, les options actives et la disponibilité sont revérifiés à l&apos;enregistrement.</p>}
      <form action={createBookingAction} className="grid max-w-4xl gap-5 lg:grid-cols-2">
        <Card title="Cliente">
          <div className="space-y-3">
            <Field label="Nom complet" name="name" required defaultValue={cust?.name} />
            <Field label="Email" name="email" type="email" required defaultValue={cust?.email} />
            <Field label="Téléphone" name="phone" required defaultValue={cust?.phone} />
          </div>
        </Card>
        <Card title="Service">
          <div className="space-y-3">
            <Select label="Pack / prestation" name="item" defaultValue={fromItem}>
              <optgroup label="Packs">{packs.map((p) => <option key={p.id} value={`PACKAGE:${p.id}`}>{p.name}</option>)}</optgroup>
              <optgroup label="Prestations">{services.map((s) => <option key={s.id} value={`SERVICE:${s.id}`}>{s.name}</option>)}</optgroup>
            </Select>
            <Select label="Variante (packs uniquement)" name="variantId" defaultValue={from?.variantId ?? ""}>
              <option value="">— aucune —</option>
              {packs.filter((p) => p.variants.length).map((p) => (
                <optgroup key={p.id} label={p.name}>{p.variants.map((v) => <option key={v.id} value={v.id}>{v.label} — {v.price}€</option>)}</optgroup>
              ))}
            </Select>
            <fieldset>
              <legend className="mb-1 text-[12px] font-medium text-[#444]">Options</legend>
              <div className="space-y-1.5">
                {options.map((o) => (
                  <label key={o.id} className="flex items-center gap-2 text-[13.5px]">
                    <input type="checkbox" name="optionIds" value={o.id} defaultChecked={from?.options.some((x) => x.optionId === o.id)} className="accent-ink" />
                    {o.name} (+{o.priceModifier}€)
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </Card>
        <Card title="Date & heure">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" name="date" type="date" required />
            <Field label="Heure de début" name="startTime" type="time" required step={900} />
          </div>
          <div className="mt-3"><Check label="Forcer même si le créneau chevauche un autre rendez-vous" name="force" /></div>
        </Card>
        <Card title="Prix, acompte & statut">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix total (€)" name="total" type="number" min={0} hint="Vide = calculé automatiquement" />
            <Field label="Acompte (€)" name="deposit" type="number" min={0} hint="Vide = règle du produit" />
          </div>
          <div className="mt-3">
            <Select label="Statut" name="status" defaultValue="CONFIRMED">
              <option value="CONFIRMED">Confirmé</option>
              <option value="PENDING_PAYMENT">Paiement en attente</option>
            </Select>
          </div>
          <TextArea label="Notes internes" name="adminNotes" className="mt-3" rows={3} />
        </Card>
        <div className="lg:col-span-2"><Submit>Créer le rendez-vous</Submit></div>
      </form>
    </>
  );
}
