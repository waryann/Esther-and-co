import { NextRequest, NextResponse } from "next/server";
import { getOptionsFor } from "@/lib/catalog";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") === "SERVICE" ? "SERVICE" : "PACKAGE";
  const options = await getOptionsFor(type);
  return NextResponse.json({
    options: options.map((o) => ({ id: o.id, name: o.name, description: o.description, price: o.priceModifier, icon: o.icon, image: o.image })),
  });
}
