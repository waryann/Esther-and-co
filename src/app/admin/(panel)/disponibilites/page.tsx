import { db } from "@/lib/db";
import { addBlocked, addException, deleteBlocked, deleteException, saveHours } from "@/app/admin/actions";
import { DAYS_FR, fmtMin, formatDateFr, nowInTz } from "@/lib/time";
import { getSettings } from "@/lib/settings";
import { Card, Check, Field, Flash, PageHead, Submit, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function AvailabilityAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const s = await getSettings();
  const today = nowInTz(s.timezone).date;
  const [hours, exceptions, blocked] = await Promise.all([
    db.openingHour.findMany(),
    db.availabilityException.findMany({ where: { date: { gte: today } }, orderBy: { date: "asc" } }),
    db.blockedSlot.findMany({ where: { date: { gte: today } }, orderBy: [{ date: "asc" }, { startMin: "asc" }] }),
  ]);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <>
      <PageHead title="Disponibilités" sub="Le calendrier public = horaires − rendez-vous − créneaux bloqués. Rien n'est affiché à la main." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Horaires de travail">
          <form action={saveHours} className="space-y-2">
            {order.map((d) => {
              const h = hours.find((x) => x.weekday === d);
              return (
                <div key={d} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-3">
                  <span className="capitalize text-[14px]">{DAYS_FR[d]}</span>
                  <input type="time" name={`start${d}`} defaultValue={fmtMin(h?.startMin ?? 540)} className="border border-line px-2 py-2 text-[14px]" />
                  <input type="time" name={`end${d}`} defaultValue={fmtMin(h?.endMin ?? 1080)} className="border border-line px-2 py-2 text-[14px]" />
                  <Check label="Fermé" name={`closed${d}`} defaultChecked={h?.closed} />
                </div>
              );
            })}
            <div className="pt-3"><Submit>Enregistrer les horaires</Submit></div>
          </form>
          <p className="mt-3 text-[12px] text-[#888]">Intervalle entre créneaux : réglage « slotIntervalMinutes » dans Paramètres (actuellement {s.slotIntervalMinutes} min).</p>
        </Card>

        <div className="space-y-5">
          <Card title="Jours exceptionnels (fermeture, demi-journée, ouverture)">
            <form action={addException} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3">
              <Field label="Date" name="date" type="date" required />
              <Field label="Début" name="start" type="time" defaultValue="09:00" />
              <Field label="Fin" name="end" type="time" defaultValue="13:00" />
              <Field label="Note" name="note" className="col-span-2" />
              <div className="space-y-2"><Check label="Journée fermée" name="closed" /><Submit className="!py-2">Ajouter</Submit></div>
            </form>
            <p className="mt-2 text-[12px] text-[#888]">Un jour exceptionnel remplace les horaires habituels de ce jour (ex. dimanche ouvert 10:00–14:00, ou lundi fermé).</p>
            <ul className="mt-4 divide-y divide-line text-[13.5px]">
              {exceptions.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <span>{formatDateFr(e.date)} — {e.closed ? "Fermé" : `${fmtMin(e.startMin)}–${fmtMin(e.endMin)}`} {e.note && <em className="text-[#888]">({e.note})</em>}</span>
                  <form action={deleteException}><input type="hidden" name="id" value={e.id} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form>
                </li>
              ))}
              {exceptions.length === 0 && <li className="py-2 text-[#888]">Aucun jour exceptionnel à venir.</li>}
            </ul>
          </Card>

          <Card title="Bloquer un créneau">
            <form action={addBlocked} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
              <Field label="Date" name="date" type="date" required />
              <Field label="De" name="start" type="time" defaultValue="12:00" />
              <Field label="À" name="end" type="time" defaultValue="13:00" />
              <Field label="Raison" name="reason" />
              <div className="col-span-2 sm:col-span-4"><Submit className="!py-2">Bloquer</Submit></div>
            </form>
            <ul className="mt-4 divide-y divide-line text-[13.5px]">
              {blocked.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2">
                  <span>{formatDateFr(b.date, false)} · {fmtMin(b.startMin)}–{fmtMin(b.endMin)} {b.reason && <em className="text-[#888]">({b.reason})</em>}</span>
                  <form action={deleteBlocked}><input type="hidden" name="id" value={b.id} /><button className="text-[12px] text-red-700 underline">Débloquer</button></form>
                </li>
              ))}
              {blocked.length === 0 && <li className="py-2 text-[#888]">Aucun créneau bloqué.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
