import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { BookingError, MESSAGES } from "@/lib/booking";
import { getBookingByToken } from "@/lib/booking-view";
import { computeQuote, QUOTE_ERROR_MESSAGES } from "@/lib/pricing";
import { getProvider } from "@/lib/payments";
import { getSettings, num } from "@/lib/settings";
import { SITE_URL } from "@/lib/email";
import { handleError } from "@/lib/api";
import { recordEvent } from "@/lib/analytics";

const schema = z.object({
  method: z.enum(["card", "applepay", "paypal"]).default("card"),
  confirmChange: z.boolean().optional(),
});

/**
 * Démarre le paiement de l'acompte. Le backend REVALIDE tout :
 * service actif, options actives, prix, créneau (verrou encore valide), montant.
 */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { method, confirmChange } = schema.parse(await req.json().catch(() => ({})));
    const b = await getBookingByToken(params.token);
    if (!b) throw new BookingError("NOT_FOUND", "Rendez-vous introuvable.");
    if (b.status === "CONFIRMED" || b.status === "COMPLETED") {
      return NextResponse.json({ redirectUrl: `/paiement/instructions/${b.manageToken}` });
    }
    if (b.status !== "PENDING_PAYMENT") throw new BookingError("SESSION_EXPIRED", MESSAGES.SESSION_EXPIRED);

    const quote = await computeQuote({
      type: b.type as "PACKAGE" | "SERVICE",
      itemId: (b.packageId ?? b.serviceId)!,
      variantId: b.variantId,
      optionIds: b.options.map((o) => o.optionId).filter((x): x is string => !!x),
    });
    if (!quote.ok) {
      if (quote.error === "ITEM_INACTIVE") throw new BookingError("SERVICE_DISABLED", MESSAGES.SERVICE_DISABLED);
      throw new BookingError("INVALID", QUOTE_ERROR_MESSAGES[quote.error]);
    }
    if (quote.total !== b.totalAmount || quote.deposit !== b.depositAmount) {
      if (!confirmChange) {
        throw new BookingError("PRICE_CHANGED", "Le prix a changé depuis votre sélection. Merci de vérifier le nouveau récapitulatif.", quote);
      }
      await db.booking.update({
        where: { id: b.id },
        data: { totalAmount: quote.total, depositAmount: quote.deposit, remainingAmount: quote.remaining },
      });
    }
    const amount = quote.deposit;

    const settings = await getSettings();
    await db.booking.update({
      where: { id: b.id },
      data: { lockExpiresAt: new Date(Date.now() + num(settings.lockMinutes, 10) * 60_000) },
    });

    const payment = await db.payment.create({
      data: { bookingId: b.id, provider: getProvider().name, method, amount, status: "PENDING" },
    });
    const site = SITE_URL();
    const result = await getProvider().createCheckout({
      paymentId: payment.id,
      amount,
      description: `Acompte ${b.itemName} — ${b.reference}`,
      customerEmail: b.customer.email,
      successUrl: `${site}/paiement/retour/${b.manageToken}`,
      cancelUrl: `${site}/reservation/paiement/${b.manageToken}?echec=1`,
      method,
    });
    await db.payment.update({ where: { id: payment.id }, data: { providerRef: result.providerRef } });
    await recordEvent("checkout_started", "server", "/api/booking/pay", { reference: b.reference });
    return NextResponse.json({ redirectUrl: result.redirectUrl });
  } catch (e) {
    return handleError(e);
  }
}
