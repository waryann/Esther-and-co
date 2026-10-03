import { NextRequest, NextResponse } from "next/server";
import { EVENT_NAMES, recordEvent } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!EVENT_NAMES.includes(b.name)) return NextResponse.json({ ok: false }, { status: 400 });
    await recordEvent(b.name, String(b.sessionId ?? ""), String(b.path ?? ""), b.props ?? null);
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
