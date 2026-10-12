import { db } from "@/lib/db";
import { addBlocked, addException, addRecurringClosure, deleteBlocked, deleteException, deleteExceptionPeriod, deleteRecurringClosure, saveHours } from "@/app/admin/actions";
import { DAYS_FR, fmtMin, formatDateFr, nowInTz } from "@/lib/time";
import { getSettings } from "@/lib/settings";
import { Card, Check, Field, Flash, PageHead, Select, Submit } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const NTH = ["", "1er", "2e", "3e", "4e", "5e"];

export default async function AvailabilityAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const s = await getSettings();
  const today = nowInTz(s.timezone).date;
  const [hours, exceptions, blocked, recurring] = await Promise.all([
    db.openingHour.findMany(),
    db.availabilityException.findMany({ where: { date: { gte: today } }, orderBy: { date: "asc" } }),
    db.blockedSlot.findMany({ where: { date: { gte: today } }, orderBy: [{ date: "asc" }, { startMin: "asc" }] }),
    db.recurringClosure.findMany({ orderBy: [{ weekday: "asc" }, { nth: "asc" }] }),
  ]);
  const order = [1, 2, 3, 4, 5, 6, 0];

  // Regroupe les jours fermés consécutifs en périodes lisibles (ex. « du 23 octobre au 7 novembre »)
  const closedDays = exceptions.filter((e) => e.closed);
  const openExceptions = exceptions.filter((e) => !e.closed);
  const periods: { from: string; to: string; ids: string[]; note: string }[] = [];
  for (const e of closedDays) {
    const last = periods[periods.length - 1];
    const prev = last && new Date(last.to + "T00:00:00Z").getTime() + 86400_000 === new Date(e.date + "T00:00:00Z").getTime();
    if (last && prev && last.note === e.note) {
      last.to = e.date;
      last.ids.push(e.id);
    } else periods.push({ from: e.date, to: e.date, ids: [e.id], note: e.note });
  }

  return (
    <>
      <PageHead title="Disponibilités" sub="Le calendrier public = créneaux de base − rendez-vous − fermetures. Rien n'est affiché à la main." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Jours et créneaux">
          <p className="mb-3 text-[12.5px] text-[#666]">
            Créneaux de départ proposés : <b>{s.slotTimes || "(toutes les " + s.slotIntervalMinutes + " min)"}</b> (modifiable dans Paramètres).
            Pour chaque jour, indiquez le <b>premier</b> et le <b>dernier</b> créneau autorisés (ex. mardi : dernier créneau 16:00).
          </p>
          <form action={saveHours} className="space-y-2">
            <div className="grid grid-cols-[100px_1fr_1fr_auto] gap-3 text-[11px] uppercase tracking-[0.1em] text-taupe">
              <span /> <span>Premier créneau</span> <span>Dernier créneau</span> <span />
            </div>
            {order.map((d) => {
              const h = hours.find((x) => x.weekday === d);
              return (
                <div key={d} className="grid grid-cols-[100px_1fr_1fr_auto] items-center gap-3">
                  <span className="capitalize text-[14px]">{DAYS_FR[d]}</span>
                  <input type="time" name={`start${d}`} defaultValue={fmtMin(h?.startMin ?? 600)} className="border border-line px-2 py-2 text-[14px]" />
                  <input type="time" name={`end${d}`} defaultValue={fmtMin(h?.endMin ?? 1080)} className="border border-line px-2 py-2 text-[14px]" />
                  <Check label="Fermé" name={`closed${d}`} defaultChecked={h?.closed} />
                </div>
              );
            })}
            <div className="pt-3"><Submit>Enregistrer</Submit></div>
          </form>
        </Card>

        <div className="space-y-5">
          <Card title="Fermetures récurrentes (ex. chaque 2e et 4e mercredi)">
            <form action={addRecurringClosure} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
              <Select label="Jour" name="weekday" defaultValue="3">
                {order.map((d) => <option key={d} value={d}>{DAYS_FR[d]}</option>)}
              </Select>
              <Select label="Rang dans le mois" name="nth" defaultValue="2">
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{NTH[n]}</option>)}
              </Select>
              <Field label="Note" name="note" placeholder="Groupe CARE" />
              <Submit className="!py-2.5">Ajouter</Submit>
            </form>
            <ul className="mt-4 divide-y divide-line text-[13.5px]">
              {recurring.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <span>Chaque <b>{NTH[r.nth]} {DAYS_FR[r.weekday]}</b> du mois {r.note && <em className="text-[#888]">({r.note})</em>}</span>
                  <form action={deleteRecurringClosure}><input type="hidden" name="id" value={r.id} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form>
                </li>
              ))}
              {recurring.length === 0 && <li className="py-2 text-[#888]">Aucune fermeture récurrente.</li>}
            </ul>
          </Card>

          <Card title="Indisponibilités (jour ou période) et ouvertures exceptionnelles">
            <form action={addException} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-3">
              <Field label="Du" name="date" type="date" required />
              <Field label="Au (inclus, facultatif)" name="endDate" type="date" />
              <Field label="Note" name="note" placeholder="Congés" />
              <Field label="Premier créneau" name="start" type="time" defaultValue="10:00" />
              <Field label="Dernier créneau" name="end" type="time" defaultValue="18:00" />
              <div className="space-y-2"><Check label="Indisponible (fermé)" name="closed" /><Submit className="!py-2">Ajouter</Submit></div>
            </form>
            <p className="mt-2 text-[12px] text-[#888]">Une période « indisponible » ferme tous les jours du… au… inclus. Sans « fermé », le jour devient une ouverture exceptionnelle avec ces horaires.</p>
            <ul className="mt-4 divide-y divide-line text-[13.5px]">
              {periods.map((p) => (
                <li key={p.ids[0]} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    {p.from === p.to ? formatDateFr(p.from) : <>Du {formatDateFr(p.from, false)} au {formatDateFr(p.to, false)}</>} — <b>Indisponible</b>
                    {p.note && <em className="text-[#888]"> ({p.note})</em>}
                  </span>
                  {p.ids.length === 1 ? (
                    <form action={deleteException}><input type="hidden" name="id" value={p.ids[0]} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form>
                  ) : (
                    <form action={deleteExceptionPeriod}><input type="hidden" name="ids" value={p.ids.join(",")} /><button className="text-[12px] text-red-700 underline">Supprimer la période</button></form>
                  )}
                </li>
              ))}
              {openExceptions.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <span>{formatDateFr(e.date)} — Ouvert {fmtMin(e.startMin)}–{fmtMin(e.endMin)} {e.note && <em className="text-[#888]">({e.note})</em>}</span>
                  <form action={deleteException}><input type="hidden" name="id" value={e.id} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form>
                </li>
              ))}
              {exceptions.length === 0 && <li className="py-2 text-[#888]">Aucune indisponibilité à venir.</li>}
            </ul>
          </Card>

          <Card title="Bloquer un créneau précis">
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

