import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { saveImage, UploadError } from "@/lib/upload";
import { clientIp, rateLimit } from "@/lib/ratelimit";

const schema = z.object({
  firstName: z.string().trim().min(2, "Veuillez indiquer votre prénom.").max(60),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Votre avis est trop court.").max(1000),
});

export async function POST(req: NextRequest) {
  if (!rateLimit(`review:${clientIp(req)}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "Trop d'envois. Veuillez réessayer plus tard." }, { status: 429 });
  }
  try {
    const form = await req.formData();
    const parsed = schema.safeParse({
      firstName: form.get("firstName"),
      rating: form.get("rating"),
      comment: form.get("comment"),
    });
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

    const file = form.get("photo");
    let photo = "";
    let consent = false;
    if (file instanceof File && file.size > 0) {
      consent = form.get("consent") === "on" || form.get("consent") === "true";
      if (!consent) {
        return NextResponse.json({ error: "Merci de cocher l'autorisation d'utilisation de la photo." }, { status: 400 });
      }
      photo = await saveImage(file, 1200);
    }
    await db.review.create({
      data: {
        ...parsed.data,
        photo,
        photoConsent: consent,
        consentAt: consent ? new Date() : null,
        status: "PENDING",
      },
    });
    return NextResponse.json({ message: "Merci ! Votre avis sera publié après validation." });
  } catch (e) {
    if (e instanceof UploadError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Une erreur est survenue." }, { status: 500 });
  }
}
