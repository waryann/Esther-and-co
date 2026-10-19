import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { computeQuote } from "@/lib/pricing";
import {
  BookingError, cancelBooking, confirmPayment, createPendingBooking, expireStaleBookings,
  failPayment, rescheduleBooking, sendDueReminders, createAdminBooking,
} from "@/lib/booking";
import { getAvailableSlots, getAvailableDays, getDayWindow } from "@/lib/availability";
import { signPayload, verifySignature } from "@/lib/payments";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { addDays, nowInTz, weekdayOf } from "@/lib/time";
import { createHmac } from "node:crypto";

const customer = { name: "Sarah Test", email: "sarah@example.com", phone: "+32 4 612 34 56", notes: "" };

/** Prochain jour réservable (hors week-ends, 2e/4e mercredis, période de congés…) selon les règles du seed. */
async function openDate(offset = 10, wantWeekday?: number) {
  let d = addDays(nowInTz("Europe/Brussels").date, offset);
  while (!(await getDayWindow(d)) || (wantWeekday !== undefined && weekdayOf(d) !== wantWeekday)) d = addDays(d, 1);
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
  // On conserve les fermetures du seed (période de congés) ; on ne supprime que ce que les tests créent.
  await db.availabilityException.deleteMany({ where: { note: { not: "Indisponible" } } });
  await db.emailLog.deleteMany();
  await db.smsLog.deleteMany();
  await db.packageVariant.updateMany({ data: { active: true } });
  await db.serviceOption.updateMany({ where: { name: { in: ["Coloration", "Wavy / boucles"] } }, data: { active: true } });
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
    const b = await book(await openDate(), "10:00");
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
    const date = await openDate();
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

  it("créneaux de base 10h/12h/14h/16h/18h : un rendez-vous de 180 min à 10:00 bloque 10:00 et 12:00 (pas 14:00)", async () => {
    const date = await openDate(10, 1); // un lundi : fenêtre 10:00 → 18:00
    expect(await getAvailableSlots(date, 180)).toEqual(["10:00", "12:00", "14:00", "16:00", "18:00"]);
    await book(date, "10:00");
    const slots = await getAvailableSlots(date, 180);
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("12:00"); // 12:00–15:00 chevauche 10:00–13:00
    expect(slots).toEqual(["14:00", "16:00", "18:00"]);
    expect(await getAvailableSlots(date, 60)).toEqual(["14:00", "16:00", "18:00"]); // 12:00–13:00 chevauche encore
  });

  it("règles d'Esther : jamais le week-end", async () => {
    let d = addDays(nowInTz("Europe/Brussels").date, 3);
    for (let i = 0; i < 14; i++, d = addDays(d, 1)) {
      if ([0, 6].includes(weekdayOf(d))) expect(await getAvailableSlots(d, 120)).toEqual([]);
    }
  });

  it("règles d'Esther : mardi et jeudi limités à 16h (pas de créneau 18h)", async () => {
    for (const wd of [2, 4]) {
      const d = await openDate(10, wd);
      expect(await getAvailableSlots(d, 120)).toEqual(["10:00", "12:00", "14:00", "16:00"]);
    }
    const mon = await openDate(10, 1);
    expect((await getAvailableSlots(mon, 120)).at(-1)).toBe("18:00");
  });

  it("règles d'Esther : jamais les 2e et 4e mercredis du mois (groupe CARE)", async () => {
    // mois de décembre 2026 (hors période de congés) : mercredis 2, 9, 16, 23, 30 → 2e = 9, 4e = 23
    const wednesdays = ["2026-12-02", "2026-12-09", "2026-12-16", "2026-12-23", "2026-12-30"];
    expect(wednesdays.every((d) => weekdayOf(d) === 3)).toBe(true);
    const open = await Promise.all(wednesdays.map(async (d) => !!(await getDayWindow(d))));
    expect(open).toEqual([true, false, true, false, true]);
    const days = await getAvailableDays(2026, 11, 120);
    expect(days).not.toContain("2026-12-09");
    expect(days).not.toContain("2026-12-23");
    expect(days).toContain("2026-12-16");
  });

  it("règles d'Esther : indisponible du 23/10 au 07/11/2026 inclus, ouvert avant et après", async () => {
    for (const d of ["2026-10-23", "2026-10-26", "2026-11-03", "2026-11-06"]) expect(await getDayWindow(d)).toBeNull();
    expect(await getDayWindow("2026-10-22")).not.toBeNull(); // jeudi
    expect(await getDayWindow("2026-11-09")).not.toBeNull(); // lundi
  });

  it("exception : ouverture exceptionnelle, jour fermé et créneau bloqué", async () => {
    let sunday = addDays(nowInTz("Europe/Brussels").date, 3);
    while (weekdayOf(sunday) !== 0) sunday = addDays(sunday, 1);
    expect(await getAvailableSlots(sunday, 120)).toEqual([]);
    await db.availabilityException.create({ data: { date: sunday, closed: false, startMin: 600, endMin: 720 } });
    expect(await getAvailableSlots(sunday, 120)).toEqual(["10:00", "12:00"]); // départs de 10:00 à 12:00 inclus
    await db.blockedSlot.create({ data: { date: sunday, startMin: 720, endMin: 780 } });
    expect(await getAvailableSlots(sunday, 120)).toEqual(["10:00"]);
    await db.blockedSlot.create({ data: { date: sunday, startMin: 600, endMin: 660 } });
    expect(await getAvailableSlots(sunday, 120)).toEqual([]);
    const date = await openDate();
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
    const date = await openDate();
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
    const b = await book(await openDate(), "10:00");
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
    const sms = await db.smsLog.findMany();
    expect(sms).toHaveLength(1);
    expect(sms[0].to).toBe("3246123456");
    expect(sms[0].body).toContain("est confirmé");
  });

  it("email de confirmation : reprend les informations importantes de la prestation", async () => {
    const svc = await db.service.findUniqueOrThrow({ where: { slug: "pose-perruque" } });
    const b = await createPendingBooking({ type: "SERVICE", itemId: svc.id, optionIds: [], date: await openDate(), startTime: "10:00", customer });
    await confirmPayment((await pay(b.id)).id);
    const mail = await db.emailLog.findFirstOrThrow();
    expect(mail.body).toContain("INFORMATIONS IMPORTANTES");
    expect(mail.body).toContain("un supplément de 10€ sera ajouté lors du rendez-vous");
    expect(mail.body).toContain("tête propre et lavée");
    expect(mail.body).toContain("INFOS PRATIQUES");
    expect(mail.body).toContain("Cypriaan Verhavertstraat 55, 1500 Hal");
    expect(mail.body).toContain("AUCUN ACCOMPAGNATEUR N’EST AUTORISÉ.");
  });

  it("paiement échoué → la réservation reste PENDING_PAYMENT, aucun email", async () => {
    const b = await book(await openDate(), "10:00");
    const p = await pay(b.id);
    await failPayment(p.id);
    expect((await db.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("FAILED");
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("PENDING_PAYMENT");
    expect(await db.emailLog.count()).toBe(0);
    expect(await db.smsLog.count()).toBe(0);
  });

  it("webhook tardif sur créneau déjà repris → CONFLICT + remboursement à traiter", async () => {
    const date = await openDate();
    const first = await book(date, "10:00", { email: "late@example.com" });
    const p = await pay(first.id);
    await db.booking.update({ where: { id: first.id }, data: { lockExpiresAt: new Date(Date.now() - 1000) } });
    await expireStaleBookings();
    const winner = await book(date, "10:00", { email: "winner@example.com" });
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
    const date = await openDate();
    const b = await book(date, "10:00");
    await confirmPayment((await pay(b.id)).id);
    expect(await getAvailableSlots(date, 180)).not.toContain("10:00");
    await cancelBooking(b.id);
    expect(await getAvailableSlots(date, 180)).toContain("10:00");
  });

  it("le déplacement refuse un créneau occupé et accepte un créneau libre", async () => {
    const date = await openDate();
    const a = await book(date, "10:00", { email: "a@example.com" });
    const b = await book(date, "14:00", { email: "b@example.com" });
    await confirmPayment((await pay(a.id)).id);
    await confirmPayment((await pay(b.id)).id);
    await expect(rescheduleBooking(b.id, date, "10:00")).rejects.toMatchObject({ code: "SLOT_TAKEN" });
    await expect(rescheduleBooking(b.id, date, "16:00")).resolves.toBeTruthy();
  });

  it("un rendez-vous créé manuellement par l'admin bloque le calendrier public", async () => {
    const date = await openDate();
    const { pkg, variant } = await flipover();
    await createAdminBooking({
      customer, type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [], date, startTime: "10:00",
      status: "CONFIRMED", adminNotes: "DM Instagram", force: false,
    });
    expect(await getAvailableSlots(date, 180)).not.toContain("10:00");
    await expect(
      createAdminBooking({ customer, type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [], date, startTime: "10:00", status: "CONFIRMED", adminNotes: "", force: false }),
    ).rejects.toMatchObject({ code: "SLOT_TAKEN" });
  });

  it("rappels : envoyés une seule fois dans la fenêtre configurée", async () => {
    const date = (await openDate(2));
    const b = await book(date, "10:00");
    await confirmPayment((await pay(b.id)).id);
    await db.emailLog.deleteMany();
    await db.smsLog.deleteMany();
    await db.setting.upsert({ where: { key: "reminderHours" }, update: { value: "400,24" }, create: { key: "reminderHours", value: "400,24" } });
    expect(await sendDueReminders()).toBe(1);
    expect(await sendDueReminders()).toBe(0);
    expect((await db.emailLog.findFirstOrThrow()).subject).toBe("Votre rendez-vous approche 🤍");
    const sms = await db.smsLog.findMany();
    expect(sms).toHaveLength(1);
    expect(sms[0].body).toMatch(/^Rappel ESTHAIR & CO\./);
  });

  it("refuse des coordonnées invalides", async () => {
    const { pkg, variant } = await flipover();
    await expect(
      createPendingBooking({ type: "PACKAGE", itemId: pkg.id, variantId: variant.id, optionIds: [], date: (await openDate()), startTime: "10:00", customer: { ...customer, email: "pas-un-email" } }),
    ).rejects.toThrow();
  });
});
