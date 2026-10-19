import { db } from "./db";
import { getSettings } from "./settings";
import { SITE_URL } from "./email";
import { formatDateFr } from "./time";

const BREVO_SMS_URL = "https://api.brevo.com/v3/transactionalSMS/sms";

/**
 * Met un numéro saisi par la cliente au format attendu par Brevo (indicatif pays, chiffres uniquement).
 * « 0470 12 34 56 » → « 32470123456 » (indicatif par défaut : SMS_DEFAULT_COUNTRY_CODE, 32 = Belgique).
 */
export function normalizePhone(raw: string, defaultCountryCode = process.env.SMS_DEFAULT_COUNTRY_CODE || "32"): string | null {
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    // déjà international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = defaultCountryCode + digits.slice(1);
  }
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/** Si BREVO_API_KEY est vide, les SMS sont journalisés en base + console (comme les emails sans SMTP). */
export async function sendSms(phone: string, content: string) {
  const to = normalizePhone(phone);
  if (!to) {
    await db.smsLog.create({ data: { to: phone, body: content, status: "SKIPPED", error: "Numéro invalide" } });
    return;
  }
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(`[sms:LOGGED] → ${to} · ${content}`);
    await db.smsLog.create({ data: { to, body: content, status: "LOGGED" } });
    return;
  }
  try {
    const res = await fetch(BREVO_SMS_URL, {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: process.env.SMS_SENDER || "EsthairCo",
        recipient: to,
        content,
        type: "transactional",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) throw new Error(`Brevo ${res.status} : ${await res.text()}`);
    await db.smsLog.create({ data: { to, body: content, status: "SENT" } });
  } catch (e) {
    await db.smsLog.create({ data: { to, body: content, status: "FAILED", error: String(e) } });
  }
}

type BookingForSms = {
  manageToken: string;
  itemName: string;
  variantLabel: string;
  date: string;
  startTime: string;
  customer: { phone: string };
};

// Messages courts, sans emoji ni caractères hors alphabet GSM (é, è, à sont OK) : un SMS « Unicode » coûte 2 à 3 fois plus cher.
async function practicalInfo(b: BookingForSms) {
  const s = await getSettings();
  const service = b.itemName + (b.variantLabel ? ` (${b.variantLabel})` : "");
  const when = `${formatDateFr(b.date)} à ${b.startTime}`;
  const address = s.address ? ` Adresse : ${s.address}.` : "";
  const link = `${SITE_URL()}/rendez-vous/${b.manageToken}`;
  return { service, when, address, link };
}

export async function sendBookingConfirmationSms(b: BookingForSms) {
  const { service, when, address, link } = await practicalInfo(b);
  await sendSms(
    b.customer.phone,
    `ESTHAIR & CO. : votre RDV ${service} est confirmé pour le ${when}.${address} Détails et modification : ${link}`,
  );
}

export async function sendBookingReminderSms(b: BookingForSms) {
  const { service, when, address, link } = await practicalInfo(b);
  await sendSms(b.customer.phone, `Rappel ESTHAIR & CO. : votre RDV ${service} le ${when}.${address} Détails : ${link}`);
}
