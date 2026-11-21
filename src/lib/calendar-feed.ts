import { randomBytes, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { SITE_URL } from "./email";
import { getSettings } from "./settings";
import { addDays, nowInTz, zonedToUtc } from "./time";

/**
 * Flux iCalendar (.ics) des rendez-vous, auquel le téléphone de la gérante s'abonne (iPhone, Google Agenda…).
 * L'URL contient un jeton secret : quiconque la possède voit les rendez-vous, d'où la possibilité de la régénérer.
 */
const KEY = "calendarFeedToken";
const PAST_DAYS = 60;

export async function getFeedToken(): Promise<string> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  return row?.value || rotateFeedToken();
}

export async function rotateFeedToken(): Promise<string> {
  const value = randomBytes(24).toString("base64url");
  await db.setting.upsert({ where: { key: KEY }, update: { value }, create: { key: KEY, value } });
  return value;
}

export async function isValidFeedToken(token: string): Promise<boolean> {
  const row = await db.setting.findUnique({ where: { key: KEY } });
  if (!row?.value || row.value.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(row.value), Buffer.from(token));
}

export function feedUrls(token: string) {
  const https = `${SITE_URL()}/api/calendar/${token}.ics`;
  const webcal = https.replace(/^https?:/, "webcal:");
  return { https, webcal, google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}` };
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Replie les lignes à 75 octets comme l'exige la RFC 5545. */
function fold(line: string): string {
  const bytes = Buffer.from(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
    }
    cur += ch;
  }
  out.push(cur);
  return out.join("\r\n ");
}

export async function buildFeed(): Promise<string> {
  const s = await getSettings();
  const from = addDays(nowInTz(s.timezone).date, -PAST_DAYS);
  const bookings = await db.booking.findMany({
    where: { date: { gte: from }, status: { in: ["CONFIRMED", "COMPLETED", "CONFLICT"] } },
    include: { customer: true, options: true },
    orderBy: [{ date: "asc" }, { startMin: "asc" }],
  });

  const now = stamp(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ESTHAIR & CO.//Rendez-vous//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`${s.siteName} — Rendez-vous`)}`,
    `X-WR-TIMEZONE:${s.timezone}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];

  for (const b of bookings) {
    const item = b.variantLabel ? `${b.itemName} (${b.variantLabel})` : b.itemName;
    const extras = b.options.map((o) => ` + ${o.name}`).join("");
    const desc = [
      `Réf. ${b.reference}`,
      `Cliente : ${b.customer.name}`,
      `Téléphone : ${b.customer.phone}`,
      `Email : ${b.customer.email}`,
      `Prestation : ${item}`,
      b.options.length ? `Options : ${b.options.map((o) => o.name).join(", ")}` : "",
      `Total : ${b.totalAmount} € — acompte ${b.depositAmount} € — reste ${b.remainingAmount} €`,
      b.status === "CONFLICT" ? "⚠ CONFLIT DE CRÉNEAU — à vérifier dans le dashboard" : "",
      b.notes ? `Note de la cliente : ${b.notes}` : "",
      b.adminNotes ? `Note interne : ${b.adminNotes}` : "",
      `${SITE_URL()}/admin/rendez-vous/${b.id}`,
    ].filter(Boolean);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.id}@esthair-co`,
      `DTSTAMP:${now}`,
      `LAST-MODIFIED:${stamp(b.updatedAt)}`,
      `DTSTART:${stamp(zonedToUtc(b.date, b.startMin, s.timezone))}`,
      `DTEND:${stamp(zonedToUtc(b.date, b.endMin, s.timezone))}`,
      `SUMMARY:${esc(`${b.status === "CONFLICT" ? "⚠ " : ""}${b.customer.name} — ${item}${extras}`)}`,
      `DESCRIPTION:${esc(desc.join("\n"))}`,
      ...(s.address ? [`LOCATION:${esc(s.address)}`] : []),
      `URL:${SITE_URL()}/admin/rendez-vous/${b.id}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:Rendez-vous ESTHAIR & CO.",
      "TRIGGER:-PT1H",
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
