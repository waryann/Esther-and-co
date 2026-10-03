import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Adresse email invalide.").max(160) });

export async function POST(req: NextRequest) {
  if (!rateLimit(`nl:${clientIp(req)}`, 8, 10 * 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives. Veuillez réessayer plus tard." }, { status: 429 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { email } = parsed.data;
  const existing = await db.newsletterSubscriber.findUnique({ where: { email } });
  if (!existing) await db.newsletterSubscriber.create({ data: { email } });
  // Même message si déjà inscrite : ne révèle pas si une adresse est connue.
  return NextResponse.json({ message: "Merci ! Vous êtes maintenant inscrite à notre newsletter." });
}
