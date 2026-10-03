import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, getAdmin, loginAllowed, loginFailed, verifyLogin } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function login(fd: FormData) {
  "use server";
  const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!loginAllowed(ip)) redirect("/admin/login?error=Trop+de+tentatives.+Réessayez+dans+15+minutes.");
  const user = await verifyLogin(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
  if (!user) {
    loginFailed(ip);
    redirect("/admin/login?error=Identifiants+incorrects.");
  }
  await createSession(user.id);
  redirect("/admin");
}

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <form action={login} className="w-full max-w-sm border border-line bg-white p-8">
        <div className="text-center font-serif text-[22px] uppercase tracking-[0.14em]">ESTHAIR &amp; CO.</div>
        <p className="mb-6 mt-1 text-center text-[12px] uppercase tracking-[0.14em] text-taupe">Espace admin</p>
        {searchParams.error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{searchParams.error}</p>}
        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field mb-4" />
        <label className="field-label" htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field mb-6" />
        <button className="btn-dark">SE CONNECTER</button>
      </form>
    </div>
  );
}
