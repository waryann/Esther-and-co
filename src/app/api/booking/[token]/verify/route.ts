import { NextResponse } from "next/server";
import { reconcilePendingBookingPayments } from "@/lib/booking";
import { getBookingByToken } from "@/lib/booking-view";

export const dynamic = "force-dynamic";

/** Appelé au retour de Stripe : le SERVEUR demande à Stripe si le paiement est bien réglé (le navigateur ne prouve rien). */
export async function POST(_: Request, { params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  if (b.status !== "CONFIRMED" && b.status !== "COMPLETED") await reconcilePendingBookingPayments(b.id);
  const after = await getBookingByToken(params.token);
  return NextResponse.json({ status: after?.status, paymentStatus: after?.payments[0]?.status ?? null });
}
