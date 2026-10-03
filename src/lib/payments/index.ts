import { createHmac, timingSafeEqual } from "node:crypto";
import { mockProvider } from "./mock";
import { stripeProvider } from "./stripe";
import type { PaymentProvider } from "./types";
import { mockPaymentsAllowed, secretEnv } from "../env";

export function getProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "stripe") return stripeProvider;
  if (!mockPaymentsAllowed()) {
    throw new Error("Paiement non configuré : le mode démo est interdit en production. Configurez PAYMENT_PROVIDER=stripe.");
  }
  return mockProvider;
}

export const webhookSecret = () => secretEnv("PAYMENT_WEBHOOK_SECRET", "dev-webhook-secret");

export function signPayload(raw: string): string {
  return createHmac("sha256", webhookSecret()).update(raw).digest("hex");
}

export function verifySignature(raw: string, signature: string | null): boolean {
  if (!signature) return false;
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(signPayload(raw), "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
