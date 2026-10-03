import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { signPayload } from "@/lib/payments";
import { SITE_URL } from "@/lib/email";
import { mockPaymentsAllowed } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement (démo)", robots: { index: false } };

async function load(paymentId: string) {
  if (process.env.PAYMENT_PROVIDER === "stripe" || !mockPaymentsAllowed()) notFound();
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!payment || payment.provider !== "mock") notFound();
  return payment;
}

/** Simule le prestataire : appelle le webhook SIGNÉ, exactement comme le ferait un vrai prestataire. */
async function callWebhook(type: "payment.succeeded" | "payment.failed", paymentId: string, providerRef: string) {
  const raw = JSON.stringify({ type, paymentId, providerRef });
  const res = await fetch(`${SITE_URL()}/api/webhooks/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-esthair-signature": signPayload(raw) },
    body: raw,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Webhook ${res.status}`);
}

export default async function MockPayPage({ params }: { params: { paymentId: string } }) {
  const payment = await load(params.paymentId);
  const token = payment.booking.manageToken;

  async function succeed() {
    "use server";
    const p = await load(params.paymentId);
    await callWebhook("payment.succeeded", p.id, p.providerRef);
    redirect(`/paiement/retour/${token}`);
  }
  async function fail() {
    "use server";
    const p = await load(params.paymentId);
    await callWebhook("payment.failed", p.id, p.providerRef);
    redirect(`/reservation/paiement/${token}?echec=1`);
  }
  async function cancel() {
    "use server";
    redirect(`/reservation/paiement/${token}?echec=1`);
  }

  return (
    <div className="mx-auto max-w-sm px-5 py-16 text-center">
      <p className="label-caps text-taupe">Prestataire de paiement — mode démo</p>
      <h1 className="h-display mt-3 text-[30px]">{payment.amount} €</h1>
      <p className="mt-1 text-[13.5px] text-[#555]">Acompte · {payment.booking.itemName} · {payment.booking.reference}</p>
      <p className="mt-4 bg-sand p-3 text-[12px] text-[#555]">
        Cette page simule un prestataire de paiement. En production, elle est remplacée par Stripe (ou autre) et c&apos;est le webhook du prestataire qui confirme la réservation.
      </p>
      <div className="mt-6 space-y-3">
        <form action={succeed}><button className="btn-dark">Payer (succès)</button></form>
        <form action={fail}><button className="btn-outline">Simuler un échec de paiement</button></form>
        <form action={cancel}><button className="text-[12.5px] text-taupe underline">Annuler</button></form>
      </div>
    </div>
  );
}
