import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { addDays, formatDateFr, nowInTz, weekdayOf } from "@/lib/time";
import { Card, PageHead, Table } from "@/components/admin/ui";
import { eur } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTIVE = ["CONFIRMED", "COMPLETED"];

export default async function Dashboard() {
  const s = await getSettings();
  const today = nowInTz(s.timezone).date;
  const wd = (weekdayOf(today) + 6) % 7;
  const weekStart = addDays(today, -wd);
  const weekEnd = addDays(weekStart, 6);
  const since = new Date(Date.now() - 7 * 86400_000);
  const since30 = new Date(Date.now() - 30 * 86400_000);

  const [todayN, weekN, newN, pendingN, conflictN, deposits, upcoming, noScreens] = await Promise.all([
    db.booking.count({ where: { date: today, status: { in: ACTIVE } } }),
    db.booking.count({ where: { date: { gte: weekStart, lte: weekEnd }, status: { in: ACTIVE } } }),
    db.booking.count({ where: { status: "CONFIRMED", confirmedAt: { gte: since } } }),
    db.booking.count({ where: { status: "PENDING_PAYMENT", lockExpiresAt: { gt: new Date() } } }),
    db.booking.count({ where: { status: "CONFLICT" } }),
    db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: since30 } }, _sum: { amount: true }, _count: true }),
    db.booking.findMany({
      where: { date: { gte: today }, status: "CONFIRMED" },
      orderBy: [{ date: "asc" }, { startMin: "asc" }],
      take: 8,
      include: { customer: true },
    }),
    db.booking.count({ where: { status: "CONFIRMED", paymentScreenshotSent: false } }),
  ]);

  // Funnel (30 derniers jours) : sessions distinctes par événement (les événements serveur sont comptés en lignes).
  async function sessions(names: string[]) {
    const rows = await db.analyticsEvent.findMany({
      where: { name: { in: names }, createdAt: { gte: since30 }, sessionId: { not: "server" } },
      select: { sessionId: true },
      distinct: ["sessionId"],
    });
    return rows.length;
  }
  const paid = await db.analyticsEvent.count({ where: { name: "payment_success", createdAt: { gte: since30 } } });
  const funnel = [
    ["Visiteurs", await sessions(["page_view"])],
    ["Ouvrent la réservation", await sessions(["reservation_started"])],
    ["Choisissent un service", await sessions(["service_selected", "package_selected"])],
    ["Choisissent une date", await sessions(["date_selected"])],
    ["Arrivent au paiement", await sessions(["customer_info_submitted"])],
    ["Paient", paid],
  ] as const;
  const top = Math.max(1, funnel[0][1]);

  const stats: [string, string | number, string?][] = [
    ["Rendez-vous aujourd'hui", todayN],
    ["Rendez-vous cette semaine", weekN],
    ["Nouveaux rendez-vous (7 j)", newN],
    ["Acomptes reçus (30 j)", eur(deposits._sum.amount ?? 0), `${deposits._count} paiement(s)`],
    ["Rendez-vous en attente", pendingN, "paiement en cours"],
  ];

  return (
    <>
      <PageHead title="Dashboard" sub={`Aujourd'hui : ${formatDateFr(today)}`} />
      {conflictN > 0 && (
        <Link href="/admin/rendez-vous?status=CONFLICT" className="mb-5 block border border-red-300 bg-red-50 px-4 py-3 text-[13.5px] text-red-900">
          ⚠ {conflictN} paiement(s) reçu(s) sur un créneau déjà pris : à traiter (déplacer ou rembourser).
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map(([k, v, sub]) => (
          <div key={k} className="border border-line bg-white p-4">
            <div className="text-[11px] uppercase tracking-[0.1em] text-taupe">{k}</div>
            <div className="mt-2 font-serif text-[32px] leading-none">{v}</div>
            {sub && <div className="mt-1 text-[11.5px] text-[#888]">{sub}</div>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-taupe">Prochains rendez-vous</h2>
          <Table head={["Date", "Cliente", "Service", ""]} empty={upcoming.length ? undefined : "Aucun rendez-vous à venir."}>
            {upcoming.map((b) => (
              <tr key={b.id}>
                <td className="whitespace-nowrap px-4 py-3">{formatDateFr(b.date, false)} · {b.startTime}</td>
                <td className="px-4 py-3">{b.customer.name}</td>
                <td className="px-4 py-3">{b.itemName}{b.variantLabel ? ` — ${b.variantLabel}` : ""}</td>
                <td className="px-4 py-3 text-right"><Link className="underline" href={`/admin/rendez-vous/${b.id}`}>Ouvrir</Link></td>
              </tr>
            ))}
          </Table>
          {noScreens > 0 && <p className="mt-3 text-[12.5px] text-[#666]">{noScreens} rendez-vous confirmé(s) sans preuve de paiement reçue sur Instagram.</p>}
        </div>

        <Card title="Entonnoir de conversion (30 jours)">
          <ul className="space-y-3">
            {funnel.map(([label, n], i) => (
              <li key={label}>
                <div className="flex justify-between text-[13px]">
                  <span>{label}</span>
                  <span className="tabular-nums">
                    {n}{i > 0 && funnel[i - 1][1] > 0 ? <span className="ml-2 text-[11px] text-[#888]">{Math.round((n / funnel[i - 1][1]) * 100)}%</span> : null}
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-sand"><div className="h-full bg-ink" style={{ width: `${Math.min(100, (n / top) * 100)}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
