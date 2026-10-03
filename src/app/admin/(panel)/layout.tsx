import Link from "next/link";
import { redirect } from "next/navigation";
import { destroySession, requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

async function logout() {
  "use server";
  await destroySession();
  redirect("/admin/login");
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="lg:flex">
      <aside className="border-b border-line bg-ink text-white lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin" className="font-serif text-[17px] uppercase tracking-[0.14em]">ESTHAIR &amp; CO.</Link>
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/50 lg:mt-1 lg:block">Back-office</span>
        </div>
        <AdminNav />
        <div className="hidden px-5 py-5 text-[12px] text-white/60 lg:block">
          <div className="truncate">{admin.email}</div>
          <Link href="/" target="_blank" className="mt-2 block underline">Voir le site</Link>
          <form action={logout}><button className="mt-2 underline">Se déconnecter</button></form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-10 lg:py-9">{children}</main>
    </div>
  );
}
