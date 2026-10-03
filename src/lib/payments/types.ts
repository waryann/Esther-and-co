export type CheckoutParams = {
  paymentId: string;
  amount: number; // euros
  description: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  method: string;
};

export type CheckoutResult = { redirectUrl: string; providerRef: string };

export interface PaymentProvider {
  name: string;
  createCheckout(p: CheckoutParams): Promise<CheckoutResult>;
}
