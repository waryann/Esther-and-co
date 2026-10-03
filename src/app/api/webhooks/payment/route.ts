import { NextRequest, NextResponse } from "next/server";
import { confirmPayment, failPayment } from "@/lib/booking";
import { verifySignature } from "@/lib/payments";
import { recordEvent } from "@/lib/analytics";

/**
 * Webhook générique (prestataire "mock" / futurs prestataires).
 * Corps JSON : { type: "payment.succeeded" | "payment.failed", paymentId, providerRef }
 * En-tête `x-esthair-signature` : HMAC-SHA256 hex du corps brut avec PAYMENT_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-esthair-signature"))) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }
  let evt: { type?: string; paymentId?: string; providerRef?: string };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "JSON invalide." }, { status: 400 });
  }
  if (!evt.paymentId) return NextResponse.json({ error: "paymentId manquant." }, { status: 400 });

  if (evt.type === "payment.succeeded") {
    await confirmPayment(evt.paymentId, evt.providerRef);
    await recordEvent("payment_success", "server", "/api/webhooks/payment");
    await recordEvent("booking_confirmed", "server", "/api/webhooks/payment");
  } else if (evt.type === "payment.failed") {
    await failPayment(evt.paymentId);
  }
  return NextResponse.json({ received: true });
}
