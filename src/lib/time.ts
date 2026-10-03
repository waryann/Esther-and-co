// Toutes les dates métier sont des chaînes "YYYY-MM-DD" et des minutes depuis minuit,
// exprimées dans le fuseau de l'entreprise (réglage `timezone`).

export const DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
export const DAYS_SHORT_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export const pad = (n: number) => String(n).padStart(2, "0");

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function fmtMin(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

export function isDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function weekdayOf(date: string): number {
  return new Date(date + "T00:00:00Z").getUTCDay();
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysInMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

/** Date et minute courantes dans le fuseau donné. */
export function nowInTz(tz: string, now = new Date()): { date: string; min: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    min: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/** Convertit (date locale, minutes) dans un fuseau en instant UTC. */
export function zonedToUtc(date: string, min: number, tz: string): Date {
  const guess = new Date(`${date}T${fmtMin(min)}:00Z`);
  const local = nowInTz(tz, guess);
  const localAsUtc = new Date(`${local.date}T${fmtMin(local.min)}:00Z`);
  const offset = localAsUtc.getTime() - guess.getTime();
  return new Date(guess.getTime() - offset);
}

export function formatDateFr(date: string, withWeekday = true): string {
  const d = new Date(date + "T00:00:00Z");
  const base = `${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  if (!withWeekday) return base;
  const wd = DAYS_FR[d.getUTCDay()];
  return `${wd.charAt(0).toUpperCase() + wd.slice(1)} ${base}`;
}

export function formatDateNumeric(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
