import Link from "next/link";
import { db } from "@/lib/db";
import { eur } from "@/lib/format";
import { formatDateFr } from "@/lib/time";
import { Badge, Flash, LinkButton, PageHead, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW", "EXPIRED", "CONFLICT"];

export default async function BookingsPage({ searchParams }: { searchParams: { status?: string; q?: string; msg?: string; error?: string } }) {
  const q = searchParams.q?.trim();
  const bookings = await db.booking.findMany({
    where: {
      status: searchParams.status || undefined,
      ...(q
        ? { OR: [{ reference: { contains: q } }, { customer: { name: { contains: q } } }, { customer: { email: { contains: q } } }] }
        : {}),
    },
    orderBy: [{ date: "desc" }, { startMin: "desc" }],
    take: 200,
    include: { customer: true },
  });
  return (
    <>
      <PageHead title="Rendez-vous" action={<LinkButton href="/admin/rendez-vous/nouveau">+ NOUVEAU RENDEZ-VOUS</LinkButton>} />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Rechercher (réf., nom, email)" className="w-64 border border-line bg-white px-3 py-2 text-[13.5px]" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="border border-line bg-white px-3 py-2 text-[13.5px]">
          <option value="">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="bg-ink px-4 py-2 text-[12px] uppercase tracking-[0.1em] text-white">Filtrer</button>
      </form>
      <Table head={["Réf.", "Date", "Cliente", "Service", "Total / Acompte", "Statut", "Source"]} empty={bookings.length ? undefined : "Aucun rendez-vous."}>
        {bookings.map((b) => (
          <tr key={b.id} className="hover:bg-sand/30">
            <td className="px-4 py-3"><Link className="underline" href={`/admin/rendez-vous/${b.id}`}>{b.reference}</Link></td>
            <td className="whitespace-nowrap px-4 py-3">{formatDateFr(b.date, false)} · {b.startTime}</td>
            <td className="px-4 py-3">{b.customer.name}</td>
            <td className="px-4 py-3">{b.itemName}{b.variantLabel ? ` — ${b.variantLabel}` : ""}</td>
            <td className="whitespace-nowrap px-4 py-3">{eur(b.totalAmount)} / {eur(b.depositAmount)}</td>
            <td className="px-4 py-3"><Badge status={b.status} /></td>
            <td className="px-4 py-3 text-[12px] text-[#777]">{b.source === "ADMIN" ? "Admin" : "Site"}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
