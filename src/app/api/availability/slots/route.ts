import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { expireStaleBookings } from "@/lib/booking";
import { getDuration } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const type = q.get("type") === "SERVICE" ? "SERVICE" : "PACKAGE";
  const itemId = q.get("itemId") ?? "";
  const date = q.get("date") ?? "";
  const duration = await getDuration(type, itemId);
  if (!duration) return NextResponse.json({ error: "Ce service n'est actuellement plus disponible à la réservation.", code: "SERVICE_DISABLED" }, { status: 409 });
  await expireStaleBookings();
  const slots = await getAvailableSlots(date, duration);
  return NextResponse.json({ slots });
}
