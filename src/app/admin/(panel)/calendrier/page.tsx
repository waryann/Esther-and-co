import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { DAYS_SHORT_FR, MONTHS_FR, addDays, daysInMonth, fmtMin, formatDateFr, isDateStr, nowInTz, pad, weekdayOf } from "@/lib/time";
import { PageHead, STATUS_LABEL } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const COLORS: Record<string, string> = {
  CONFIRMED: "bg-green-100 border-green-500 text-green-900",
  PENDING_PAYMENT: "bg-amber-100 border-amber-500 text-amber-900",
  COMPLETED: "bg-sky-100 border-sky-500 text-sky-900",
  NO_SHOW: "bg-red-100 border-red-500 text-red-900",
  CONFLICT: "bg-red-200 border-red-600 text-red-900",
};

const PX = 56; // hauteur d'une heure

export default async function CalendarPage({ searchParams }: { searchParams: { view?: string; date?: string } }) {
  const s = await getSettings();
  const today = nowInTz(s.timezone).date;
  const view = ["day", "week", "month"].includes(searchParams.view ?? "") ? (searchParams.view as "day" | "week" | "month") : "week";
  const date = searchParams.date && isDateStr(searchParams.date) ? searchParams.date : today;

  let from = date;
  let to = date;
  let prev = addDays(date, -1);
  let next = addDays(date, 1);
  let title = formatDateFr(date);
  if (view === "week") {
    from = addDays(date, -((weekdayOf(date) + 6) % 7));
    to = addDays(from, 6);
    prev = addDays(from, -7);
    next = addDays(from, 7);
    title = `Semaine du ${formatDateFr(from, false)}`;
  } else if (view === "month") {
    const [y, m] = date.split("-").map(Number);
    from = `${y}-${pad(m)}-01`;
    to = `${y}-${pad(m)}-${pad(daysInMonth(y, m - 1))}`;
    prev = addDays(from, -1).slice(0, 8) + "01";
    next = addDays(to, 1);
    title = `${MONTHS_FR[m - 1]} ${y}`;
  }

  const [bookings, blocked, hours, exceptions] = await Promise.all([
    db.booking.findMany({
      where: {
        date: { gte: from, lte: to },
        OR: [{ status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW", "CONFLICT"] } }, { status: "PENDING_PAYMENT", lockExpiresAt: { gt: new Date() } }],
      },
      include: { customer: true },
      orderBy: { startMin: "asc" },
    }),
    db.blockedSlot.findMany({ where: { date: { gte: from, lte: to } } }),
    db.openingHour.findMany(),
    db.availabilityException.findMany({ where: { date: { gte: from, lte: to } } }),
  ]);

  const openStart = Math.min(540, ...hours.filter((h) => !h.closed).map((h) => h.startMin), ...bookings.map((b) => b.startMin));
  const openEnd = Math.max(1080, ...hours.filter((h) => !h.closed).map((h) => h.endMin), ...bookings.map((b) => b.endMin));
  const gridStart = Math.floor(openStart / 60) * 60;
  const gridEnd = Math.ceil(openEnd / 60) * 60;
  const hoursList = Array.from({ length: (gridEnd - gridStart) / 60 }, (_, i) => gridStart + i * 60);

  const dayList = view === "week" ? Array.from({ length: 7 }, (_, i) => addDays(from, i)) : [date];
  const q = (v: string, d: string) => `/admin/calendrier?view=${v}&date=${d}`;

  const tab = (v: string, label: string) => (
    <Link href={q(v, date)} className={`px-4 py-2 text-[12px] uppercase tracking-[0.1em] ${view === v ? "bg-ink text-white" : "border border-line bg-white"}`}>{label}</Link>
  );

  return (
    <>
      <PageHead
        title="Calendrier"
        sub={title}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {tab("day", "Jour")}{tab("week", "Semaine")}{tab("month", "Mois")}
            <Link href={q(view, prev)} className="border border-line bg-white px-3 py-2">‹</Link>
            <Link href={q(view, today)} className="border border-line bg-white px-3 py-2 text-[12px]">Aujourd&apos;hui</Link>
            <Link href={q(view, next)} className="border border-line bg-white px-3 py-2">›</Link>
          </div>
        }
      />

      {view === "month" ? (
        <div className="grid grid-cols-7 gap-px border border-line bg-line text-[12.5px]">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <div key={d} className="bg-sand/60 px-2 py-2 text-center text-[11px] uppercase text-taupe">{d}</div>)}
          {Array.from({ length: (weekdayOf(from) + 6) % 7 }).map((_, i) => <div key={`e${i}`} className="bg-[#f6f2ec]" />)}
          {Array.from({ length: Number(to.slice(8)) }, (_, i) => {
            const d = `${from.slice(0, 8)}${pad(i + 1)}`;
            const day = bookings.filter((b) => b.date === d);
            const closed = exceptions.find((e) => e.date === d)?.closed ?? hours.find((h) => h.weekday === weekdayOf(d))?.closed;
            return (
              <div key={d} className={`min-h-[96px] bg-white p-1.5 ${closed ? "bg-neutral-50" : ""}`}>
                <Link href={q("day", d)} className={`text-[12px] ${d === today ? "rounded-full bg-ink px-1.5 py-0.5 text-white" : "text-taupe"}`}>{i + 1}</Link>
                {closed && <span className="ml-1 text-[10px] text-[#aaa]">fermé</span>}
                <div className="mt-1 space-y-1">
                  {day.slice(0, 3).map((b) => (
                    <Link key={b.id} href={`/admin/rendez-vous/${b.id}`} className={`block truncate border-l-2 px-1.5 py-0.5 text-[11px] ${COLORS[b.status] ?? ""}`}>
                      {b.startTime} {b.customer.name.split(" ")[0]}
                    </Link>
                  ))}
                  {day.length > 3 && <Link href={q("day", d)} className="block text-[11px] text-taupe">+{day.length - 3} autre(s)</Link>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-white">
          <div className="flex min-w-[640px]">
            <div className="w-14 shrink-0 border-r border-line pt-9 text-right text-[11px] text-[#999]">
              {hoursList.map((h) => <div key={h} style={{ height: PX }} className="pr-2">{fmtMin(h)}</div>)}
            </div>
            {dayList.map((d) => {
              const exc = exceptions.find((e) => e.date === d);
              const oh = hours.find((h) => h.weekday === weekdayOf(d));
              const closed = exc ? exc.closed : oh?.closed;
              const dayBookings = bookings.filter((b) => b.date === d);
              const dayBlocked = blocked.filter((b) => b.date === d);
              return (
                <div key={d} className="min-w-0 flex-1 border-r border-line last:border-r-0">
                  <Link href={q("day", d)} className={`flex h-9 items-center justify-center border-b border-line text-[12.5px] ${d === today ? "bg-ink text-white" : "bg-sand/50"}`}>
                    {DAYS_SHORT_FR[weekdayOf(d)]} {d.slice(8)}/{d.slice(5, 7)}
                  </Link>
                  <div className="relative" style={{ height: hoursList.length * PX }}>
                    {hoursList.map((h, i) => <div key={h} className="absolute inset-x-0 border-t border-line/70" style={{ top: i * PX }} />)}
                    {closed && <div className="absolute inset-0 bg-neutral-100/80 text-center text-[11px] text-[#aaa]"><span className="mt-3 block">Fermé</span></div>}
                    {dayBlocked.map((b) => (
                      <div key={b.id} className="absolute inset-x-1 border border-dashed border-neutral-400 bg-neutral-200/70 px-1 text-[10.5px] text-neutral-600" style={{ top: ((b.startMin - gridStart) / 60) * PX, height: ((b.endMin - b.startMin) / 60) * PX }}>
                        Bloqué {b.reason}
                      </div>
                    ))}
                    {dayBookings.map((b) => (
                      <Link
                        key={b.id}
                        href={`/admin/rendez-vous/${b.id}`}
                        title={STATUS_LABEL[b.status]}
                        className={`absolute inset-x-1 overflow-hidden border-l-4 px-1.5 py-1 text-[11px] leading-tight ${COLORS[b.status] ?? "bg-neutral-100"}`}
                        style={{ top: ((b.startMin - gridStart) / 60) * PX + 1, height: ((b.endMin - b.startMin) / 60) * PX - 2 }}
                      >
                        <b>{b.startTime}</b> {b.customer.name}
                        <div className="truncate">{b.itemName}</div>
                        <div className="text-[10px] opacity-75">{STATUS_LABEL[b.status]}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="mt-3 text-[12px] text-[#888]">Cliquez sur un rendez-vous pour ouvrir sa fiche. Les créneaux en attente de paiement (verrouillés) apparaissent en orange.</p>
    </>
  );
}
