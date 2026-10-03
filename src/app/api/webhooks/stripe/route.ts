import { NextRequest, NextResponse } from "next/server";
import { confirmPayment, failPayment } from "@/lib/booking";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { recordEvent } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook non configuré." }, { status: 503 });
  const raw = await req.text();
  if (!verifyStripeSignature(raw, req.headers.get("stripe-signature"), secret)) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }
  const evt = JSON.parse(raw) as { type: string; data: { object: { id: string; payment_status?: string; metadata?: { paymentId?: string } } } };
  const obj = evt.data.object;
  const paymentId = obj.metadata?.paymentId;
  if (!paymentId) return NextResponse.json({ received: true });

  if (
    evt.type === "checkout.session.completed" ||
    evt.type === "checkout.session.async_payment_succeeded"
  ) {
    if (obj.payment_status === "paid") {
      await confirmPayment(paymentId, obj.id);
      await recordEvent("payment_success", "server", "/api/webhooks/stripe");
      await recordEvent("booking_confirmed", "server", "/api/webhooks/stripe");
    }
  } else if (evt.type === "checkout.session.async_payment_failed" || evt.type === "checkout.session.expired") {
    await failPayment(paymentId);
  }
  return NextResponse.json({ received: true });
}
