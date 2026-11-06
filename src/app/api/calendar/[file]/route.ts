import { NextResponse } from "next/server";
import { buildFeed, isValidFeedToken } from "@/lib/calendar-feed";

export const dynamic = "force-dynamic";

/** Flux .ics des rendez-vous, lu par le calendrier du téléphone. Le jeton est dans le nom du fichier : /api/calendar/<jeton>.ics */
export async function GET(_req: Request, { params }: { params: { file: string } }) {
  const token = params.file.replace(/\.ics$/, "");
  if (!(await isValidFeedToken(token))) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(await buildFeed(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="esthair-rendez-vous.ics"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
