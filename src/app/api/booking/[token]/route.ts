import { NextResponse } from "next/server";
import { getBookingByToken, publicSummary } from "@/lib/booking-view";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const b = await getBookingByToken(params.token);
  if (!b) return NextResponse.json({ error: "Rendez-vous introuvable.", code: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ booking: publicSummary(b) });
}
