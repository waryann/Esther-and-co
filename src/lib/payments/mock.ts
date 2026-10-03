import type { PaymentProvider } from "./types";

/** Prestataire de démonstration : redirige vers /pay/mock/[paymentId] qui déclenche le webhook signé. */
export const mockProvider: PaymentProvider = {
  name: "mock",
  async createCheckout(p) {
    return { redirectUrl: `/pay/mock/${p.paymentId}`, providerRef: `mock_${p.paymentId}` };
  },
};
