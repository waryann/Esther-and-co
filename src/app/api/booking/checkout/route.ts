import { NextRequest, NextResponse } from "next/server";
import { checkoutSchema, createPendingBooking, releasePendingBooking } from "@/lib/booking";
import { handleError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 12, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives. Veuillez réessayer dans quelques minutes." }, { status: 429 });
  }
  try {
    const body = await req.json();
    const replaceToken = typeof body.replaceToken === "string" ? body.replaceToken : null;
    const input = checkoutSchema.parse(body);
    if (replaceToken) await releasePendingBooking(replaceToken);
    const booking = await createPendingBooking(input);
    return NextResponse.json({ token: booking.manageToken });
  } catch (e) {
    return handleError(e);
  }
}
