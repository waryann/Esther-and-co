import Link from "next/link";
import { db } from "@/lib/db";
import { PageHead, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ClientsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams.q?.trim();
  const customers = await db.customer.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { bookings: { where: { status: { in: ["CONFIRMED", "COMPLETED"] } }, select: { id: true } } },
  });
  return (
    <>
      <PageHead title="Clients" sub="Les clientes avec plusieurs rendez-vous sont des clientes récurrentes." />
      <form className="mb-4"><input name="q" defaultValue={q} placeholder="Rechercher (nom, email, téléphone)" className="w-72 border border-line bg-white px-3 py-2 text-[13.5px]" /></form>
      <Table head={["Nom", "Email", "Téléphone", "RDV", ""]} empty={customers.length ? undefined : "Aucune cliente."}>
        {customers.map((c) => (
          <tr key={c.id}>
            <td className="px-4 py-3">{c.name}</td>
            <td className="px-4 py-3">{c.email}</td>
            <td className="px-4 py-3">{c.phone}</td>
            <td className="px-4 py-3">{c.bookings.length}{c.bookings.length > 1 && <span className="ml-2 bg-tan/40 px-1.5 py-0.5 text-[10.5px]">récurrente</span>}</td>
            <td className="px-4 py-3 text-right"><Link className="underline" href={`/admin/clients/${c.id}`}>Fiche</Link></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
