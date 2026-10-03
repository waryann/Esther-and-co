import { createHmac, timingSafeEqual } from "node:crypto";
import type { PaymentProvider } from "./types";

/**
 * Adaptateur Stripe Checkout (sans SDK). Prêt à activer avec PAYMENT_PROVIDER=stripe
 * + STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET. Non testé contre un compte réel.
 */
export const stripeProvider: PaymentProvider = {
  name: "stripe",
  async createCheckout(p) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY manquant");
    const body = new URLSearchParams({
      mode: "payment",
      success_url: p.successUrl,
      cancel_url: p.cancelUrl,
      client_reference_id: p.paymentId,
      customer_email: p.customerEmail,
      "metadata[paymentId]": p.paymentId,
      "payment_intent_data[metadata][paymentId]": p.paymentId,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "eur",
      "line_items[0][price_data][unit_amount]": String(p.amount * 100),
      "line_items[0][price_data][product_data][name]": p.description,
      expires_at: String(Math.floor(Date.now() / 1000) + 31 * 60),
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
    if (!res.ok || !json.url || !json.id) throw new Error(json.error?.message || "Erreur Stripe");
    return { redirectUrl: json.url, providerRef: json.id };
  },
};

/** Vérifie l'en-tête Stripe-Signature (schéma v1, tolérance 5 min). */
export function verifyStripeSignature(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts["t"];
  const v1 = header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  if (!t || !v1.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest();
  return v1.some((sig) => {
    const buf = Buffer.from(sig, "hex");
    return buf.length === expected.length && timingSafeEqual(buf, expected);
  });
}
