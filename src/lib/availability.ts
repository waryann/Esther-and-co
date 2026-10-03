import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";
import { getSettings, num } from "./settings";
import { addDays, daysInMonth, fmtMin, isDateStr, nowInTz, pad, weekdayOf } from "./time";

type Client = PrismaClient | Prisma.TransactionClient;

export type Interval = { startMin: number; endMin: number };

/** Statuts qui occupent le calendrier. PENDING_PAYMENT n'occupe que tant que le verrou n'a pas expiré. */
const BLOCKING = ["CONFIRMED", "COMPLETED", "NO_SHOW", "CONFLICT"];

export async function getDayWindow(date: string, c: Client = db): Promise<Interval | null> {
  const exc = await c.availabilityException.findUnique({ where: { date } });
  if (exc) return exc.closed ? null : { startMin: exc.startMin, endMin: exc.endMin };
  const oh = await c.openingHour.findUnique({ where: { weekday: weekdayOf(date) } });
  if (!oh || oh.closed) return null;
  return { startMin: oh.startMin, endMin: oh.endMin };
}

export async function getBusyIntervals(
  date: string,
  c: Client = db,
  excludeBookingId?: string,
): Promise<Interval[]> {
  const now = new Date();
  const [bookings, blocked] = await Promise.all([
    c.booking.findMany({
      where: {
        date,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [
          { status: { in: BLOCKING } },
          { status: "PENDING_PAYMENT", lockExpiresAt: { gt: now } },
        ],
      },
      select: { startMin: true, endMin: true },
    }),
    c.blockedSlot.findMany({ where: { date }, select: { startMin: true, endMin: true } }),
  ]);
  return [...bookings, ...blocked];
}

export const overlaps = (a: Interval, b: Interval) => a.startMin < b.endMin && a.endMin > b.startMin;

/** Fonction pure : créneaux de départ possibles dans une fenêtre, hors périodes occupées. */
export function computeSlots(
  window: Interval | null,
  busy: Interval[],
  durationMin: number,
  intervalMin: number,
  earliestStartMin = 0,
): number[] {
  if (!window) return [];
  const out: number[] = [];
  for (let s = window.startMin; s + durationMin <= window.endMin; s += intervalMin) {
    if (s < earliestStartMin) continue;
    const slot = { startMin: s, endMin: s + durationMin };
    if (busy.some((b) => overlaps(slot, b))) continue;
    out.push(s);
  }
  return out;
}

async function earliestFor(date: string): Promise<number | "closed"> {
  const s = await getSettings();
  const tz = s.timezone;
  const now = nowInTz(tz);
  const noticeMin = Math.round(num(s.minNoticeHours, 0) * 60);
  if (date < now.date) return "closed";
  const maxDate = addDays(now.date, num(s.maxDaysAhead, 90));
  if (date > maxDate) return "closed";
  if (date === now.date) return now.min + noticeMin;
  // préavis dépassant minuit
  const nowAbs = now.min + noticeMin;
  if (nowAbs >= 1440) {
    const daysOver = Math.floor(nowAbs / 1440);
    if (date < addDays(now.date, daysOver)) return "closed";
    if (date === addDays(now.date, daysOver)) return nowAbs % 1440;
  }
  return 0;
}

export async function getAvailableSlots(
  date: string,
  durationMin: number,
  opts: { excludeBookingId?: string; ignoreNotice?: boolean } = {},
): Promise<string[]> {
  if (!isDateStr(date)) return [];
  const s = await getSettings();
  let earliest = 0;
  if (!opts.ignoreNotice) {
    const e = await earliestFor(date);
    if (e === "closed") return [];
    earliest = e;
  }
  const [window, busy] = await Promise.all([
    getDayWindow(date),
    getBusyIntervals(date, db, opts.excludeBookingId),
  ]);
  return computeSlots(window, busy, durationMin, num(s.slotIntervalMinutes, 60), earliest).map(fmtMin);
}

/** Jours d'un mois ayant au moins un créneau disponible. */
export async function getAvailableDays(
  year: number,
  month0: number,
  durationMin: number,
  excludeBookingId?: string,
): Promise<string[]> {
  const s = await getSettings();
  const interval = num(s.slotIntervalMinutes, 60);
  const n = daysInMonth(year, month0);
  const first = `${year}-${pad(month0 + 1)}-01`;
  const last = `${year}-${pad(month0 + 1)}-${pad(n)}`;
  const now = new Date();
  const [exceptions, hours, bookings, blocked] = await Promise.all([
    db.availabilityException.findMany({ where: { date: { gte: first, lte: last } } }),
    db.openingHour.findMany(),
    db.booking.findMany({
      where: {
        date: { gte: first, lte: last },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [{ status: { in: BLOCKING } }, { status: "PENDING_PAYMENT", lockExpiresAt: { gt: now } }],
      },
      select: { date: true, startMin: true, endMin: true },
    }),
    db.blockedSlot.findMany({ where: { date: { gte: first, lte: last } } }),
  ]);
  const excMap = new Map(exceptions.map((e) => [e.date, e]));
  const hourMap = new Map(hours.map((h) => [h.weekday, h]));
  const result: string[] = [];
  for (let d = 1; d <= n; d++) {
    const date = `${year}-${pad(month0 + 1)}-${pad(d)}`;
    const earliest = await earliestFor(date);
    if (earliest === "closed") continue;
    const exc = excMap.get(date);
    let window: Interval | null;
    if (exc) window = exc.closed ? null : { startMin: exc.startMin, endMin: exc.endMin };
    else {
      const oh = hourMap.get(weekdayOf(date));
      window = !oh || oh.closed ? null : { startMin: oh.startMin, endMin: oh.endMin };
    }
    const busy = [...bookings, ...blocked].filter((b) => b.date === date);
    if (computeSlots(window, busy, durationMin, interval, earliest).length) result.push(date);
  }
  return result;
}

/** Vérifie qu'un intervalle est libre (utilisé dans la transaction de création de réservation). */
export async function isIntervalFree(
  c: Client,
  date: string,
  iv: Interval,
  excludeBookingId?: string,
): Promise<boolean> {
  const busy = await getBusyIntervals(date, c, excludeBookingId);
  return !busy.some((b) => overlaps(iv, b));
}
