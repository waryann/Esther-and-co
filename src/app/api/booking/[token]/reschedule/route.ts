import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BookingError, rescheduleBooking, selfServiceAllowed } from "@/lib/booking";
import { getBookingByToken } from "@/lib/booking-view";
import { getAvailableSlots } from "@/lib/availability";
import { addDays } from "@/lib/time";
import { handleError } from "@/lib/api";

const schema = z.object({ date: z.string(), startTime: z.string() });

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { date, startTime } = schema.parse(await req.json());
    const b = await getBookingByToken(params.token);
    if (!b) throw new BookingError("NOT_FOUND", "Rendez-vous introuvable.");
    const policy = await selfServiceAllowed(b);
    if (!policy.allowed) {
      throw new BookingError("NOT_ALLOWED", "Ce rendez-vous ne peut plus être modifié en ligne. Merci de nous contacter.");
    }
    try {
      await rescheduleBooking(b.id, date, startTime);
    } catch (e) {
      if (e instanceof BookingError && e.code === "SLOT_TAKEN") {
        // Propose les autres créneaux disponibles
        const alternatives: { date: string; times: string[] }[] = [];
        for (let i = 0; i < 14 && alternatives.length < 3; i++) {
          const d = addDays(date, i);
          const times = await getAvailableSlots(d, b.endMin - b.startMin, { excludeBookingId: b.id });
          if (times.length) alternatives.push({ date: d, times });
        }
        return NextResponse.json({ error: e.message, code: e.code, alternatives }, { status: 409 });
      }
      throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
