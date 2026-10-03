import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Enregistre uniquement `paymentScreenshotSent` : ne modifie JAMAIS le statut du paiement ni du rendez-vous. */
export async function POST(_: Request, { params }: { params: { token: string } }) {
  const b = await db.booking.findUnique({ where: { manageToken: params.token } });
  if (!b) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  await db.booking.update({ where: { id: b.id }, data: { paymentScreenshotSent: true } });
  return NextResponse.json({ ok: true });
}
