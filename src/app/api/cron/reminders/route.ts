import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expireStaleBookings, reconcileStripePayment, sendDueReminders } from "@/lib/booking";

export const dynamic = "force-dynamic";

/** À appeler régulièrement (ex. toutes les 15 min) : Authorization: Bearer $CRON_SECRET */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  // Filet de sécurité : paiements Stripe créés dans les dernières 48 h dont le webhook n'est jamais arrivé.
  const pending = await db.payment.findMany({
    where: { provider: "stripe", status: { in: ["PENDING", "FAILED"] }, createdAt: { gt: new Date(Date.now() - 48 * 3600_000) } },
    select: { id: true },
  });
  let reconciled = 0;
  for (const p of pending) if ((await reconcileStripePayment(p.id)) === "PAID") reconciled++;
  const expired = await expireStaleBookings();
  const reminders = await sendDueReminders();
  return NextResponse.json({ expired, reminders, reconciled });
}
