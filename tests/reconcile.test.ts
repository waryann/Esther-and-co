import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/payments/stripe", async (orig) => ({
  ...(await orig<typeof import("@/lib/payments/stripe")>()),
  fetchStripeSession: vi.fn(),
}));

import { db } from "@/lib/db";
import { createPendingBooking, reconcileStripePayment, reconcilePendingBookingPayments } from "@/lib/booking";
import { fetchStripeSession } from "@/lib/payments/stripe";
import { getDayWindow } from "@/lib/availability";
import { addDays, nowInTz } from "@/lib/time";

const mocked = vi.mocked(fetchStripeSession);

async function openDate() {
  let d = addDays(nowInTz("Europe/Brussels").date, 12);
  while (!(await getDayWindow(d))) d = addDays(d, 1);
  return d;
}

async function pendingWithStripePayment() {
  const pkg = await db.package.findUniqueOrThrow({ where: { slug: "flipover" }, include: { variants: true } });
  const b = await createPendingBooking({
    type: "PACKAGE", itemId: pkg.id, variantId: pkg.variants[0].id, optionIds: [], date: await openDate(), startTime: "10:00",
    customer: { name: "Stripe Test", email: "stripe@example.com", phone: "+32 4 612 34 56", notes: "" },
  });
  const p = await db.payment.create({ data: { bookingId: b.id, provider: "stripe", providerRef: "cs_test_123", amount: b.depositAmount } });
  return { b, p };
}

beforeEach(async () => {
  mocked.mockReset();
  await db.payment.deleteMany();
  await db.bookingOption.deleteMany();
  await db.booking.deleteMany();
  await db.emailLog.deleteMany();
});

describe("réconciliation Stripe (sans webhook)", () => {
  it("Stripe dit « paid » → paiement PAID, réservation CONFIRMED, email, idempotent", async () => {
    const { b, p } = await pendingWithStripePayment();
    mocked.mockResolvedValue({ payment_status: "paid", status: "complete" });
    expect(await reconcileStripePayment(p.id)).toBe("PAID");
    expect(await reconcileStripePayment(p.id)).toBe("PAID");
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("CONFIRMED");
    expect(await db.emailLog.count()).toBe(1);
  });

  it("confirme même si le verrou a expiré tant que le créneau est libre", async () => {
    const { b, p } = await pendingWithStripePayment();
    await db.booking.update({ where: { id: b.id }, data: { status: "EXPIRED", lockExpiresAt: new Date(Date.now() - 1000) } });
    mocked.mockResolvedValue({ payment_status: "paid", status: "complete" });
    expect(await reconcilePendingBookingPayments(b.id)).toBe("PAID");
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("CONFIRMED");
  });

  it("Stripe dit « unpaid » → rien ne change", async () => {
    const { b, p } = await pendingWithStripePayment();
    mocked.mockResolvedValue({ payment_status: "unpaid", status: "open" });
    expect(await reconcileStripePayment(p.id)).toBe("PENDING");
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("session expirée → paiement FAILED, réservation inchangée", async () => {
    const { b, p } = await pendingWithStripePayment();
    mocked.mockResolvedValue({ payment_status: "unpaid", status: "expired" });
    expect(await reconcileStripePayment(p.id)).toBe("FAILED");
    expect((await db.payment.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("FAILED");
  });

  it("Stripe injoignable → aucune confirmation", async () => {
    const { b, p } = await pendingWithStripePayment();
    mocked.mockResolvedValue(null);
    expect(await reconcileStripePayment(p.id)).toBe("PENDING");
    expect((await db.booking.findUniqueOrThrow({ where: { id: b.id } })).status).toBe("PENDING_PAYMENT");
  });
});
