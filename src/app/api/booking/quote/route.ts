import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeQuote, QUOTE_ERROR_MESSAGES } from "@/lib/pricing";
import { handleError } from "@/lib/api";

const schema = z.object({
  type: z.enum(["PACKAGE", "SERVICE"]),
  itemId: z.string().min(1),
  variantId: z.string().nullish(),
  optionIds: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const q = await computeQuote(schema.parse(await req.json()));
    if (!q.ok) return NextResponse.json({ error: QUOTE_ERROR_MESSAGES[q.error], code: q.error }, { status: 409 });
    return NextResponse.json({ quote: q });
  } catch (e) {
    return handleError(e);
  }
}
