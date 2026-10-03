import { NextRequest, NextResponse } from "next/server";
import { getAvailableDays } from "@/lib/availability";
import { getDuration } from "@/lib/pricing";
import { getSettings, num } from "@/lib/settings";
import { addDays, nowInTz } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const type = q.get("type") === "SERVICE" ? "SERVICE" : "PACKAGE";
  const itemId = q.get("itemId") ?? "";
  const month = q.get("month") ?? ""; // YYYY-MM
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m || !itemId) return NextResponse.json({ error: "Paramètres invalides." }, { status: 400 });
  const duration = await getDuration(type, itemId);
  if (!duration) return NextResponse.json({ error: "Ce service n'est actuellement plus disponible à la réservation.", code: "SERVICE_DISABLED" }, { status: 409 });
  const excludeBookingId = q.get("exclude") ?? undefined;
  const days = await getAvailableDays(Number(m[1]), Number(m[2]) - 1, duration, excludeBookingId);
  const s = await getSettings();
  const today = nowInTz(s.timezone).date;
  return NextResponse.json({ days, today, maxDate: addDays(today, num(s.maxDaysAhead, 90)) });
}
