import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { computeQuote } from "@/lib/pricing";
import {
  BookingError, cancelBooking, confirmPayment, createPendingBooking, expireStaleBookings,
  failPayment, rescheduleBooking, sendDueReminders, createAdminBooking,
} from "@/lib/booking";
import { getAvailableSlots } from "@/lib/availability";
import { signPayload, verifySignature } from "@/lib/payments";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { addDays, nowInTz, weekdayOf } from "@/lib/time";
import { createHmac } from "node:crypto";

const customer = { name: "Sarah Test", email: "sarah@example.com", phone: "+32 4 612 34 56", notes: "" };

function openDate(offset = 10) {
  let d = addDays(nowInTz("Europe/Brussels").date, offset);
  while (weekdayOf(d) === 0) d = addDays(d, 1); // dimanche fermé dans le seed
  return d;
}

async function flipover(label = '3 paquets 18"') {
  const pkg = await db.package.findUniqueOrThrow({ where: { slug: "flipover" }, include: { variants: true } });
  return { pkg, variant: pkg.variants.find((v) => v.label === label)! };
}

beforeEach(async () => {
  await db.payment.deleteMany();
  await db.reminderLog.deleteMany();
  await db.bookingOption.deleteMany();
  await db.booking.deleteMany();
  await db.blockedSlot.deleteMany();
  await db.availabilityException.deleteMany();
  await db.emailLog.deleteMany();
  await db.packageVariant.updateMany({ data: { active: true } });
  await db.serviceOption.updateMany({ data: { active: true } });
  await db.package.updateMany({ data: { active: true } });
  await db.setting.deleteMany({ where: { key: { in: ["lockMinutes", "reminderHours"] } } });
});

async function book(date: string, startTime: string, opts: { email?: string; optionIds?: string[] } = {}) {
  const { pkg, variant } = await flipover();
  return createPendingBooking({
    type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: opts.optionIds ?? [],
    date, startTime, customer: { ...customer, email: opts.email ?? customer.email },
  });
}

async function pay(bookingId: string) {
  const b = await db.booking.findUniqueOrThrow({ where: { id: bookingId } });
  return db.payment.create({ data: { bookingId, provider: "mock", amount: b.depositAmount, providerRef: "x" } });
}

describe("prix dynamique", () => {
  it("calcule variante + options côté serveur", async () => {
    const { pkg, variant } = await flipover();
    const color = await db.serviceOption.findFirstOrThrow({ where: { name: "Coloration" } });
    const q = await computeQuote({ type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [color.id] });
    expect(q.ok && q.total).toBe(325 + 50);
    expect(q.ok && q.deposit).toBe(50);
    expect(q.ok && q.remaining).toBe(325);
  });

  it("variantes Flipover conformes au brief", async () => {
    const { pkg } = await flipover();
    const prices = Object.fromEntries((await db.packageVariant.findMany({ where: { packageId: pkg.id } })).map((v) => [v.label, v.price]));
    expect(prices).toEqual({ '2 paquets 16"': 200, '3 paquets 16"': 265, '3 paquets 18"': 325, '3 paquets 20"': 330 });
  });

  it("acompte 50 € pour un pack, 20 € pour une prestation", async () => {
    const svc = await db.service.findUniqueOrThrow({ where: { slug: "pony-lace" } });
    const q = await computeQuote({ type: "SERVICE", itemId: svc.id });
    expect(q.ok && q.total).toBe(100);
    expect(q.ok && q.deposit).toBe(20);
    expect(q.ok && q.remaining).toBe(80);
    const balayage = await db.package.findUniqueOrThrow({ where: { slug: "tissage-balayage" } });
    const q2 = await computeQuote({ type: "PACKAGE", itemId: balayage.id });
    expect(q2.ok && [q2.total, q2.deposit, q2.remaining]).toEqual([400, 50, 350]);
  });

  it("refuse une option désactivée, une variante manquante ou un pack désactivé", async () => {
    const { pkg, variant } = await flipover();
    const color = await db.serviceOption.findFirstOrThrow({ where: { name: "Coloration" } });
    await db.serviceOption.update({ where: { id: color.id }, data: { active: false } });
    expect(await computeQuote({ type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [color.id] })).toMatchObject({ ok: false, error: "OPTION_INVALID" });
    expect(await computeQuote({ type: "PACKAGE", itemId: pkg.id })).toMatchObject({ ok: false, error: "VARIANT_REQUIRED" });
    await db.package.update({ where: { id: pkg.id }, data: { active: false } });
    expect(await computeQuote({ type: "PACKAGE", itemId: pkg.id, variantId: variant.id })).toMatchObject({ ok: false, error: "ITEM_INACTIVE" });
  });

  it("un changement de prix en admin est détecté après création de la réservation", async () => {
    const b = await book(openDate(), "09:00");
    const { pkg, variant } = await flipover();
    await db.packageVariant.update({ where: { id: variant.id }, data: { price: 340 } });
    const q = await computeQuote({ type: "PACKAGE", itemId: pkg.id, variantId: variant.id });
    expect(b.totalAmount).toBe(325);
    expect(q.ok && q.total).toBe(340);
    await db.packageVariant.update({ where: { id: variant.id }, data: { price: 325 } });
  });
});

describe("disponibilités & double réservation", () => {
  it("un seul des deux checkouts simultanés sur le même créneau réussit", async () => {
    const date = openDate();
    const results = await Promise.allSettled([
      book(date, "10:00", { email: "a@example.com" }),
      book(date, "10:00", { email: "b@example.com" }),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const ko = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(ko[0].reason).toBeInstanceOf(BookingError);
    expect(ko[0].reason.code).toBe("SLOT_TAKEN");
  });

  it("un rendez-vous de 180 min à 10:00 bloque 10:00, 11:00 et 12:00 (pas 13:00)", async () => {
    const date = openDate();
    await book(date, "10:00");
    const slots = await getAvailableSlots(date, 180);
    expect(slots).not.toContain("09:00"); // 09:00–12:00 chevauche
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("11:00");
    expect(slots).not.toContain("12:00");
    expect(slots).toContain("13:00");
    const short = await getAvailableSlots(date, 60);
    expect(short).toContain("09:00");
    expect(short).not.toContain("10:00");
    expect(short).toContain("13:00");
  });

  it("respecte horaires, jour fermé, exception et créneau bloqué", async () => {
    let sunday = addDays(nowInTz("Europe/Brussels").date, 3);
    while (weekdayOf(sunday) !== 0) sunday = addDays(sunday, 1);
    expect(await getAvailableSlots(sunday, 120)).toEqual([]);
    await db.availabilityException.create({ data: { date: sunday, closed: false, startMin: 600, endMin: 780 } });
    expect(await getAvailableSlots(sunday, 120)).toEqual(["10:00", "11:00"]);
    await db.blockedSlot.create({ data: { date: sunday, startMin: 660, endMin: 720 } });
    expect(await getAvailableSlots(sunday, 120)).toEqual([]);
    const date = openDate();
    await db.availabilityException.create({ data: { date, closed: true } });
    expect(await getAvailableSlots(date, 60)).toEqual([]);
  });

  it("ne propose pas de créneau dans le passé", async () => {
    const today = nowInTz("Europe/Brussels").date;
    expect(await getAvailableSlots(addDays(today, -1), 60)).toEqual([]);
  });
});

describe("verrou temporaire (lock)", () => {
  it("le créneau est verrouillé tant que le verrou est actif puis libéré à l'expiration", async () => {
    const date = openDate();
    const b = await book(date, "14:00");
    expect(b.status).toBe("PENDING_PAYMENT");
    expect(b.lockExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    expect(await getAvailableSlots(date, 180)).not.toContain("14:00");

    await db.booking.update({ where: { id: b.id }, data: { lockExpiresAt: new Date(Date.now() - 1000) } });
    expect(await getAvailableSlots(date, 180)).toContain("14:00"); // libéré même avant le nettoyage
    expect(await expireStaleBookings()).toBe(1);
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("EXPIRED");
    // une autre cliente peut réserver
    await expect(book(date, "14:00", { email: "other@example.com" })).resolves.toBeTruthy();
  });
});

describe("paiement & webhook", () => {
  it("paiement réussi → CONFIRMED + email + idempotent", async () => {
    const b = await book(openDate(), "09:00");
    const p = await pay(b.id);
    await confirmPayment(p.id, "ref_1");
    await confirmPayment(p.id, "ref_1"); // webhook rejoué
    const after = await db.booking.findUniqueOrThrow({ where: { id: b.id } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.lockExpiresAt).toBeNull();
    const pay1 = await db.payment.findUniqueOrThrow({ where: { id: p.id } });
    expect(pay1.status).toBe("PAID");
    expect(pay1.paidAt).toBeTruthy();
    expect(pay1.providerRef).toBe("ref_1");
    const mails = await db.emailLog.findMany();
    expect(mails).toHaveLength(1);
    expect(mails[0].subject).toBe("Votre rendez-vous ESTHAIR & CO. est confirmé 🤍");
  });

  it("paiement échoué → la réservation reste PENDING_PAYMENT, aucun email", async () => {
    const b = await book(openDate(), "09:00");
    const p = await pay(b.id);
    await failPayment(p.id);
    expect((await db.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("FAILED");
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("PENDING_PAYMENT");
    expect(await db.emailLog.count()).toBe(0);
  });

  it("webhook tardif sur créneau déjà repris → CONFLICT + remboursement à traiter", async () => {
    const date = openDate();
    const first = await book(date, "09:00", { email: "late@example.com" });
    const p = await pay(first.id);
    await db.booking.update({ where: { id: first.id }, data: { lockExpiresAt: new Date(Date.now() - 1000) } });
    await expireStaleBookings();
    const winner = await book(date, "09:00", { email: "winner@example.com" });
    const wp = await pay(winner.id);
    await confirmPayment(wp.id);
    await confirmPayment(p.id);
    expect((await db.booking.findUniqueOrThrow({ where: { id: first.id } })).status).toBe("CONFLICT");
    expect((await db.payment.findUniqueOrThrow({ where: { id: p.id } })).needsRefund).toBe(true);
    expect((await db.booking.findUniqueOrThrow({ where: { id: winner.id } })).status).toBe("CONFIRMED");
  });

  it("signatures de webhook", async () => {
    const raw = JSON.stringify({ type: "payment.succeeded", paymentId: "p1" });
    expect(verifySignature(raw, signPayload(raw))).toBe(true);
    expect(verifySignature(raw + " ", signPayload(raw))).toBe(false);
    expect(verifySignature(raw, null)).toBe(false);
    expect(verifySignature(raw, "00")).toBe(false);

    const t = Math.floor(Date.now() / 1000);
    const sig = createHmac("sha256", "whsec").update(`${t}.${raw}`).digest("hex");
    expect(verifyStripeSignature(raw, `t=${t},v1=${sig}`, "whsec")).toBe(true);
    expect(verifyStripeSignature(raw, `t=${t},v1=${sig}`, "other")).toBe(false);
    expect(verifyStripeSignature(raw, `t=${t - 1000},v1=${sig}`, "whsec")).toBe(false);
  });
});

describe("annulation, déplacement, admin, rappels", () => {
  it("l'annulation libère le créneau", async () => {
    const date = openDate();
    const b = await book(date, "09:00");
    await confirmPayment((await pay(b.id)).id);
    expect(await getAvailableSlots(date, 180)).not.toContain("09:00");
    await cancelBooking(b.id);
    expect(await getAvailableSlots(date, 180)).toContain("09:00");
  });

  it("le déplacement refuse un créneau occupé et accepte un créneau libre", async () => {
    const date = openDate();
    const a = await book(date, "09:00", { email: "a@example.com" });
    const b = await book(date, "13:00", { email: "b@example.com" });
    await confirmPayment((await pay(a.id)).id);
    await confirmPayment((await pay(b.id)).id);
    await expect(rescheduleBooking(b.id, date, "10:00")).rejects.toMatchObject({ code: "SLOT_TAKEN" });
    await expect(rescheduleBooking(b.id, date, "15:00")).resolves.toBeTruthy();
  });

  it("un rendez-vous créé manuellement par l'admin bloque le calendrier public", async () => {
    const date = openDate();
    const { pkg, variant } = await flipover();
    await createAdminBooking({
      customer, type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [], date, startTime: "09:00",
      status: "CONFIRMED", adminNotes: "DM Instagram", force: false,
    });
    expect(await getAvailableSlots(date, 180)).not.toContain("09:00");
    await expect(
      createAdminBooking({ customer, type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [], date, startTime: "10:00", status: "CONFIRMED", adminNotes: "", force: false }),
    ).rejects.toMatchObject({ code: "SLOT_TAKEN" });
  });

  it("rappels : envoyés une seule fois dans la fenêtre configurée", async () => {
    const date = openDate(2);
    const b = await book(date, "09:00");
    await confirmPayment((await pay(b.id)).id);
    await db.emailLog.deleteMany();
    await db.setting.upsert({ where: { key: "reminderHours" }, update: { value: "400,24" }, create: { key: "reminderHours", value: "400,24" } });
    expect(await sendDueReminders()).toBe(1);
    expect(await sendDueReminders()).toBe(0);
    expect((await db.emailLog.findFirstOrThrow()).subject).toBe("Votre rendez-vous approche 🤍");
  });

  it("refuse des coordonnées invalides", async () => {
    const { pkg, variant } = await flipover();
    await expect(
      createPendingBooking({ type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [], date: openDate(), startTime: "09:00", customer: { ...customer, email: "pas-un-email" } }),
    ).rejects.toThrow();
  });
});
