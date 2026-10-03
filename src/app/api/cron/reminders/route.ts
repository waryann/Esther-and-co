import { NextRequest, NextResponse } from "next/server";
import { expireStaleBookings, sendDueReminders } from "@/lib/booking";

export const dynamic = "force-dynamic";

/** À appeler régulièrement (ex. toutes les 15 min) : Authorization: Bearer $CRON_SECRET */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const expired = await expireStaleBookings();
  const reminders = await sendDueReminders();
  return NextResponse.json({ expired, reminders });
}
