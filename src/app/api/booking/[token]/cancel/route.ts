import { NextResponse } from "next/server";
import { BookingError, cancelBooking, selfServiceAllowed } from "@/lib/booking";
import { getBookingByToken } from "@/lib/booking-view";
import { handleError } from "@/lib/api";

export async function POST(_: Request, { params }: { params: { token: string } }) {
  try {
    const b = await getBookingByToken(params.token);
    if (!b) throw new BookingError("NOT_FOUND", "Rendez-vous introuvable.");
    const policy = await selfServiceAllowed(b);
    if (!policy.allowed) {
      throw new BookingError("NOT_ALLOWED", "Ce rendez-vous ne peut plus être annulé en ligne. Merci de nous contacter.");
    }
    await cancelBooking(b.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
