import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { computeQuote, type Quote, type QuoteInput } from "./pricing";
import { getAvailableSlots, isIntervalFree } from "./availability";
import { getSettings, num } from "./settings";
import { fmtMin, isDateStr, toMin, zonedToUtc } from "./time";
import { sendBookingCancelled, sendBookingConfirmation, sendBookingReminder } from "./email";

// ───────────── Erreurs métier (messages affichés tels quels à la cliente) ─────────────
export class BookingError extends Error {
  constructor(
    public code:
      | "SLOT_TAKEN"
      | "SESSION_EXPIRED"
      | "SERVICE_DISABLED"
      | "PRICE_CHANGED"
      | "INVALID"
      | "NOT_FOUND"
      | "NOT_ALLOWED",
    message: string,
    public quote?: Extract<Quote, { ok: true }>,
  ) {
    super(message);
  }
}

export const MESSAGES = {
  SLOT_TAKEN: "Ce créneau vient d'être réservé. Veuillez choisir une autre heure.",
  SESSION_EXPIRED: "Votre session de réservation a expiré. Veuillez sélectionner à nouveau votre créneau.",
  SERVICE_DISABLED: "Ce service n'est actuellement plus disponible à la réservation.",
  PAYMENT_FAILED: "Le paiement n'a pas pu être effectué. Votre créneau n'a pas été confirmé.",
};

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Veuillez indiquer votre nom complet.").max(120),
  email: z.string().trim().toLowerCase().email("Adresse email invalide.").max(160),
  phone: z
    .string()
    .trim()
    .min(6, "Numéro de téléphone invalide.")
    .max(30)
    .regex(/^[+\d][\d\s().-]{5,}$/, "Numéro de téléphone invalide."),
  notes: z.string().trim().max(1000).optional().default(""),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const checkoutSchema = z.object({
  type: z.enum(["PACKAGE", "SERVICE"]),
  itemId: z.string().min(1),
  variantId: z.string().nullish(),
  optionIds: z.array(z.string()).default([]),
  date: z.string().refine(isDateStr, "Date invalide."),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customer: customerSchema,
  expectedTotal: z.number().int().optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ───────────── Utilitaires ─────────────
export async function expireStaleBookings() {
  const res = await db.booking.updateMany({
    where: { status: "PENDING_PAYMENT", lockExpiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
  return res.count;
}

async function nextReference(tx: Prisma.TransactionClient): Promise<string> {
  const row = await tx.setting.findUnique({ where: { key: "bookingCounter" } });
  const n = (row ? Number(row.value) : 1000) + 1;
  await tx.setting.upsert({
    where: { key: "bookingCounter" },
    update: { value: String(n) },
    create: { key: "bookingCounter", value: String(n) },
  });
  return `BK${n}`;
}

const token = () => randomBytes(18).toString("base64url");

async function upsertCustomer(tx: Prisma.TransactionClient, c: CustomerInput) {
  return tx.customer.upsert({
    where: { email: c.email },
    update: { name: c.name, phone: c.phone },
    create: { name: c.name, email: c.email, phone: c.phone },
  });
}

/** Revalide le panier + le créneau. Lève une BookingError si quelque chose a changé. */
export async function validateSelection(
  input: QuoteInput & { date: string; startTime: string },
  opts: { excludeBookingId?: string; ignoreNotice?: boolean } = {},
) {
  const quote = await computeQuote(input);
  if (!quote.ok) {
    if (quote.error === "ITEM_INACTIVE") throw new BookingError("SERVICE_DISABLED", MESSAGES.SERVICE_DISABLED);
    const { QUOTE_ERROR_MESSAGES } = await import("./pricing");
    throw new BookingError("INVALID", QUOTE_ERROR_MESSAGES[quote.error]);
  }
  const slots = await getAvailableSlots(input.date, quote.durationMinutes, opts);
  if (!slots.includes(input.startTime)) throw new BookingError("SLOT_TAKEN", MESSAGES.SLOT_TAKEN);
  return quote;
}

// ───────────── Création (checkout) ─────────────
/**
 * Crée une réservation PENDING_PAYMENT et verrouille le créneau pendant `lockMinutes`.
 * Les prix, durées et acomptes sont TOUJOURS recalculés ici.
 */
export async function createPendingBooking(raw: CheckoutInput) {
  const input = checkoutSchema.parse(raw);
  await expireStaleBookings();
  const settings = await getSettings();

  const quote = await validateSelection(input);
  if (input.expectedTotal !== undefined && input.expectedTotal !== quote.total) {
    throw new BookingError(
      "PRICE_CHANGED",
      "Le prix a changé depuis votre sélection. Merci de vérifier le nouveau récapitulatif.",
      quote,
    );
  }

  const startMin = toMin(input.startTime);
  const endMin = startMin + quote.durationMinutes;
  const lockExpiresAt = new Date(Date.now() + num(settings.lockMinutes, 10) * 60_000);

  return db.$transaction(async (tx) => {
    // Re-vérification à l'intérieur de la transaction : empêche la double réservation.
    if (!(await isIntervalFree(tx, input.date, { startMin, endMin }))) {
      throw new BookingError("SLOT_TAKEN", MESSAGES.SLOT_TAKEN);
    }
    const customer = await upsertCustomer(tx, input.customer);
    const reference = await nextReference(tx);
    return tx.booking.create({
      data: {
        reference,
        manageToken: token(),
        customerId: customer.id,
        type: quote.type,
        packageId: quote.type === "PACKAGE" ? quote.itemId : null,
        variantId: quote.variantId,
        serviceId: quote.type === "SERVICE" ? quote.itemId : null,
        itemName: quote.itemName,
        variantLabel: quote.variantLabel,
        date: input.date,
        startMin,
        endMin,
        startTime: fmtMin(startMin),
        endTime: fmtMin(endMin),
        totalAmount: quote.total,
        depositAmount: quote.deposit,
        remainingAmount: quote.remaining,
        status: "PENDING_PAYMENT",
        source: "WEB",
        notes: input.customer.notes ?? "",
        lockExpiresAt,
        options: { create: quote.options.map((o) => ({ optionId: o.id, name: o.name, price: o.price })) },
      },
    });
  });
}

// ───────────── Paiement ─────────────
const bookingEmailInclude = { customer: true, options: true } as const;

export async function loadForEmail(id: string) {
  return db.booking.findUniqueOrThrow({ where: { id }, include: bookingEmailInclude });
}

/**
 * Appelé UNIQUEMENT par les webhooks du prestataire de paiement. Idempotent.
 */
export async function confirmPayment(paymentId: string, providerRef?: string, paidAt = new Date()) {
  const result = await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
    if (!payment) throw new BookingError("NOT_FOUND", "Paiement introuvable.");
    if (payment.status === "PAID") return { bookingId: payment.bookingId, newlyConfirmed: false };

    const b = payment.booking;
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt, providerRef: providerRef ?? payment.providerRef },
    });

    if (b.status === "CONFIRMED" || b.status === "COMPLETED") return { bookingId: b.id, newlyConfirmed: false };

    // Le verrou a pu expirer : on ne confirme que si le créneau est toujours libre.
    const free = await isIntervalFree(tx, b.date, { startMin: b.startMin, endMin: b.endMin }, b.id);
    if (!free) {
      await tx.booking.update({ where: { id: b.id }, data: { status: "CONFLICT" } });
      await tx.payment.update({ where: { id: payment.id }, data: { needsRefund: true } });
      return { bookingId: b.id, newlyConfirmed: false };
    }
    await tx.booking.update({
      where: { id: b.id },
      data: { status: "CONFIRMED", confirmedAt: paidAt, lockExpiresAt: null },
    });
    return { bookingId: b.id, newlyConfirmed: true };
  });

  if (result.newlyConfirmed) {
    await sendBookingConfirmation(await loadForEmail(result.bookingId));
  }
  return result;
}

export async function failPayment(paymentId: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status === "PAID") return;
  // La réservation reste PENDING_PAYMENT (la cliente peut réessayer tant que le verrou est actif).
  await db.payment.update({ where: { id: paymentId }, data: { status: "FAILED" } });
}

// ───────────── Annulation / déplacement ─────────────
export async function cancelBooking(id: string, opts: { notify?: boolean } = {}) {
  const b = await db.booking.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date(), lockExpiresAt: null },
  });
  if (opts.notify !== false) await sendBookingCancelled(await loadForEmail(b.id));
  return b;
}

export async function rescheduleBooking(
  id: string,
  date: string,
  startTime: string,
  opts: { admin?: boolean; force?: boolean } = {},
) {
  const b = await db.booking.findUnique({ where: { id } });
  if (!b) throw new BookingError("NOT_FOUND", "Rendez-vous introuvable.");
  if (!isDateStr(date) || !/^\d{2}:\d{2}$/.test(startTime)) throw new BookingError("INVALID", "Date ou heure invalide.");
  const duration = b.endMin - b.startMin;
  const startMin = toMin(startTime);
  const endMin = startMin + duration;

  if (!opts.admin) {
    const slots = await getAvailableSlots(date, duration, { excludeBookingId: id });
    if (!slots.includes(startTime)) throw new BookingError("SLOT_TAKEN", MESSAGES.SLOT_TAKEN);
  }
  return db.$transaction(async (tx) => {
    if (!opts.force && !(await isIntervalFree(tx, date, { startMin, endMin }, id))) {
      throw new BookingError("SLOT_TAKEN", MESSAGES.SLOT_TAKEN);
    }
    return tx.booking.update({
      where: { id },
      data: { date, startMin, endMin, startTime: fmtMin(startMin), endTime: fmtMin(endMin) },
    });
  });
}

/** Une cliente peut-elle annuler / déplacer elle-même ? Règle fournie par l'entreprise (réglage). */
export async function selfServiceAllowed(b: { date: string; startMin: number; status: string }) {
  const s = await getSettings();
  if (b.status !== "CONFIRMED") return { allowed: false, configured: true };
  if (s.cancellationDeadlineHours.trim() === "") return { allowed: false, configured: false };
  const start = zonedToUtc(b.date, b.startMin, s.timezone);
  const deadline = start.getTime() - num(s.cancellationDeadlineHours, 0) * 3600_000;
  return { allowed: Date.now() < deadline, configured: true };
}

// ───────────── Création manuelle (admin) ─────────────
export async function createAdminBooking(args: {
  customer: CustomerInput;
  type: "PACKAGE" | "SERVICE";
  itemId: string;
  variantId?: string | null;
  optionIds: string[];
  date: string;
  startTime: string;
  totalOverride?: number | null;
  depositOverride?: number | null;
  status: string;
  adminNotes: string;
  force: boolean;
}) {
  const customer = customerSchema.parse(args.customer);
  const quote = await computeQuote(args);
  if (!quote.ok) throw new BookingError("INVALID", "Sélection invalide (service, variante ou option).");
  const startMin = toMin(args.startTime);
  const endMin = startMin + quote.durationMinutes;
  const total = args.totalOverride ?? quote.total;
  const deposit = Math.min(args.depositOverride ?? quote.deposit, total);

  return db.$transaction(async (tx) => {
    if (!(await isIntervalFree(tx, args.date, { startMin, endMin })) && !args.force) {
      throw new BookingError("SLOT_TAKEN", "Ce créneau chevauche un autre rendez-vous ou un créneau bloqué.");
    }
    const c = await upsertCustomer(tx, customer);
    return tx.booking.create({
      data: {
        reference: await nextReference(tx),
        manageToken: token(),
        customerId: c.id,
        type: quote.type,
        packageId: quote.type === "PACKAGE" ? quote.itemId : null,
        variantId: quote.variantId,
        serviceId: quote.type === "SERVICE" ? quote.itemId : null,
        itemName: quote.itemName,
        variantLabel: quote.variantLabel,
        date: args.date,
        startMin,
        endMin,
        startTime: fmtMin(startMin),
        endTime: fmtMin(endMin),
        totalAmount: total,
        depositAmount: deposit,
        remainingAmount: total - deposit,
        status: args.status,
        source: "ADMIN",
        adminNotes: args.adminNotes,
        confirmedAt: args.status === "CONFIRMED" ? new Date() : null,
        options: { create: quote.options.map((o) => ({ optionId: o.id, name: o.name, price: o.price })) },
      },
    });
  });
}

// ───────────── Rappels (cron) ─────────────
export async function sendDueReminders(now = new Date()) {
  const s = await getSettings();
  const hoursList = s.reminderHours
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => b - a);
  if (!hoursList.length) return 0;

  const bookings = await db.booking.findMany({
    where: { status: "CONFIRMED" },
    include: { ...bookingEmailInclude, reminders: true },
  });
  let sent = 0;
  for (const b of bookings) {
    const start = zonedToUtc(b.date, b.startMin, s.timezone).getTime();
    if (start <= now.getTime()) continue;
    // On n'envoie que le rappel le plus proche applicable (évite d'envoyer 48h et 24h d'un coup si le cron a du retard).
    const due = hoursList.filter((h) => now.getTime() >= start - h * 3600_000);
    if (!due.length) continue;
    const h = Math.min(...due);
    if (b.reminders.some((r) => due.includes(r.hours))) continue;
    try {
      await db.reminderLog.create({ data: { bookingId: b.id, hours: h } });
    } catch {
      continue; // déjà envoyé (contrainte unique)
    }
    await sendBookingReminder(b);
    sent++;
  }
  return sent;
}

/** Libère le verrou d'une réservation PENDING_PAYMENT abandonnée (retour arrière de la cliente). */
export async function releasePendingBooking(manageToken: string) {
  const b = await db.booking.findUnique({ where: { manageToken }, include: { payments: true } });
  if (!b || b.status !== "PENDING_PAYMENT" || b.payments.some((p) => p.status === "PAID")) return;
  await db.booking.update({ where: { id: b.id }, data: { status: "EXPIRED", lockExpiresAt: new Date() } });
}
