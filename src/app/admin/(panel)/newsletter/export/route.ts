import { getAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdmin())) return new Response("Non autorisé", { status: 401 });
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  const csv = ["email,inscrite_le", ...subs.map((s) => `${s.email},${s.createdAt.toISOString()}`)].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="newsletter.csv"' } });
}
