import { db } from "./db";
import { expireStaleBookings } from "./booking";

/** Vue publique (sans données sensibles) d'une réservation, retrouvée via son jeton. */
export async function getBookingByToken(token: string) {
  await expireStaleBookings();
  return db.booking.findUnique({
    where: { manageToken: token },
    include: { options: true, customer: true, payments: { orderBy: { createdAt: "desc" } } },
  });
}

export type BookingView = NonNullable<Awaited<ReturnType<typeof getBookingByToken>>>;

export function publicSummary(b: BookingView) {
  const lastPayment = b.payments[0];
  return {
    reference: b.reference,
    type: b.type,
    itemId: b.packageId ?? b.serviceId,
    itemName: b.itemName,
    variantLabel: b.variantLabel,
    options: b.options.map((o) => ({ name: o.name, price: o.price })),
    date: b.date,
    startTime: b.startTime,
    endTime: b.endTime,
    totalAmount: b.totalAmount,
    depositAmount: b.depositAmount,
    remainingAmount: b.remainingAmount,
    status: b.status,
    paymentStatus: lastPayment?.status ?? null,
    screenshotSent: b.paymentScreenshotSent,
    lockSecondsLeft:
      b.status === "PENDING_PAYMENT" && b.lockExpiresAt
        ? Math.max(0, Math.floor((b.lockExpiresAt.getTime() - Date.now()) / 1000))
        : 0,
    customerName: b.customer.name,
  };
}
