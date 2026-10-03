import { NextResponse } from "next/server";
import { getBookingByToken } from "@/lib/booking-view";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json({ status: b.status, paymentStatus: b.payments[0]?.status ?? null });
}
