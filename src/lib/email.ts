import nodemailer from "nodemailer";
import { db } from "./db";
import { getSettings } from "./settings";
import { eurSpaced } from "./format";
import { formatDateFr } from "./time";

export const SITE_URL = () => process.env.SITE_URL || "http://localhost:3000";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;
function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string, text: string) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:LOGGED] → ${to} · ${subject}`);
    await db.emailLog.create({ data: { to, subject, body: text, status: "LOGGED" } });
    return;
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM, to, subject, html, text });
    await db.emailLog.create({ data: { to, subject, body: text, status: "SENT" } });
  } catch (e) {
    await db.emailLog.create({ data: { to, subject, body: text, status: "FAILED", error: String(e) } });
  }
}

type BookingForEmail = {
  reference: string;
  manageToken: string;
  itemName: string;
  variantLabel: string;
  date: string;
  startTime: string;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  options: { name: string; price: number }[];
  customer: { name: string; email: string };
};

function layout(title: string, rows: [string, string][], extra: string, link: string) {
  const trs = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#8A6E52;font-size:13px;text-transform:uppercase;letter-spacing:.08em">${k}</td><td style="padding:6px 0;color:#0B0B0B;font-size:15px">${v}</td></tr>`,
    )
    .join("");
  return `<div style="background:#FBF7F1;padding:32px 16px;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E6DCCD;padding:32px">
    <div style="font-family:Georgia,serif;font-size:22px;letter-spacing:.12em;text-align:center">ESTHAIR &amp; CO.</div>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px;text-align:center;margin:24px 0">${title}</h1>
    <table style="width:100%;border-collapse:collapse">${trs}</table>
    ${extra}
    <p style="text-align:center;margin-top:28px"><a href="${link}" style="background:#0B0B0B;color:#fff;padding:12px 22px;text-decoration:none;font-size:13px;letter-spacing:.1em">GÉRER MON RENDEZ-VOUS</a></p>
  </div></div>`;
}

async function bookingRows(b: BookingForEmail): Promise<[string, string][]> {
  const s = await getSettings();
  const rows: [string, string][] = [["Service", b.itemName + (b.variantLabel ? ` — ${b.variantLabel}` : "")]];
  if (b.options.length) rows.push(["Options", b.options.map((o) => o.name).join(", ")]);
  rows.push(["Date", formatDateFr(b.date)], ["Heure", b.startTime]);
  if (s.address) rows.push(["Adresse", s.address]);
  rows.push(
    ["Total", eurSpaced(b.totalAmount)],
    ["Acompte payé", eurSpaced(b.depositAmount)],
    ["Solde à régler sur place", eurSpaced(b.remainingAmount)],
  );
  return rows;
}

export async function sendBookingConfirmation(b: BookingForEmail) {
  const s = await getSettings();
  const rows = await bookingRows(b);
  const link = `${SITE_URL()}/rendez-vous/${b.manageToken}`;
  const extra = `<p style="font-size:14px;line-height:1.6;color:#333;margin-top:20px">Merci d'envoyer une capture d'écran de votre preuve de paiement sur Instagram <b>@${s.instagramHandle}</b> afin que nous puissions garder une trace de votre paiement.</p>${
    s.bookingPolicy
      ? `<p style="font-size:13px;line-height:1.6;color:#555"><b>Politique de réservation :</b> ${s.bookingPolicy}</p>`
      : ""
  }`;
  const subject = "Votre rendez-vous ESTHAIR & CO. est confirmé 🤍";
  const html = layout("Votre rendez-vous est confirmé", rows, extra, link);
  const text = `${subject}\n\n${rows.map(([k, v]) => `${k} : ${v}`).join("\n")}\n\nMerci d'envoyer une capture d'écran de votre preuve de paiement sur Instagram @${s.instagramHandle}.\nGérer mon rendez-vous : ${link}`;
  await sendEmail(b.customer.email, subject, html, text);
}

export async function sendBookingReminder(b: BookingForEmail) {
  const rows = await bookingRows(b);
  const link = `${SITE_URL()}/rendez-vous/${b.manageToken}`;
  const subject = "Votre rendez-vous approche 🤍";
  const html = layout("Votre rendez-vous approche", rows, "", link);
  const text = `${subject}\n\n${rows.map(([k, v]) => `${k} : ${v}`).join("\n")}\n\n${link}`;
  await sendEmail(b.customer.email, subject, html, text);
}

export async function sendBookingCancelled(b: BookingForEmail) {
  const rows = await bookingRows(b);
  const link = `${SITE_URL()}/reservation`;
  const subject = "Votre rendez-vous ESTHAIR & CO. a été annulé";
  const html = layout("Votre rendez-vous a été annulé", rows, "", link).replace("GÉRER MON RENDEZ-VOUS", "RÉSERVER À NOUVEAU");
  await sendEmail(b.customer.email, subject, html, `${subject}\n\n${rows.map(([k, v]) => `${k} : ${v}`).join("\n")}`);
}
