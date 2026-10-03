import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/** Première barrière : toute route /admin (sauf /admin/login) exige une session valide. Chaque page/action revérifie aussi. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  const token = req.cookies.get("esthair_admin")?.value;
  try {
    if (!token) throw new Error("no token");
    const secret = process.env.AUTH_SECRET || (process.env.NODE_ENV === "production" ? "" : "dev-insecure-secret");
    if (secret.length < 16) throw new Error("AUTH_SECRET manquant");
    await jwtVerify(token, new TextEncoder().encode(secret));
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = { matcher: ["/admin/:path*"] };
