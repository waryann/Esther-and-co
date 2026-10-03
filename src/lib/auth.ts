import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { secretEnv } from "./env";

const COOKIE = "esthair_admin";
const secret = () => new TextEncoder().encode(secretEnv("AUTH_SECRET", "dev-insecure-secret"));

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  cookies().delete(COOKIE);
}

export async function getAdmin() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return await db.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
}

/** À appeler en tête de chaque page admin ET de chaque server action admin. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function verifyLogin(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");
    return null;
  }
  return (await bcrypt.compare(password, user.passwordHash)) ? user : null;
}

// Limitation basique des tentatives de connexion (en mémoire).
const attempts = new Map<string, { n: number; reset: number }>();
export function loginAllowed(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.reset < now) return true;
  return a.n < 8;
}
export function loginFailed(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (!a || a.reset < now) attempts.set(key, { n: 1, reset: now + 15 * 60_000 });
  else a.n++;
}
