import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { BookingError } from "./booking";

export function handleError(e: unknown) {
  if (e instanceof BookingError) {
    const status =
      e.code === "SESSION_EXPIRED" ? 410 : e.code === "NOT_FOUND" ? 404 : e.code === "INVALID" ? 400 : e.code === "NOT_ALLOWED" ? 403 : 409;
    return NextResponse.json({ error: e.message, code: e.code, quote: e.quote }, { status });
  }
  if (e instanceof ZodError) {
    return NextResponse.json({ error: e.issues[0]?.message ?? "Données invalides.", code: "INVALID" }, { status: 400 });
  }
  console.error(e);
  return NextResponse.json({ error: "Une erreur est survenue. Veuillez réessayer.", code: "SERVER" }, { status: 500 });
}
