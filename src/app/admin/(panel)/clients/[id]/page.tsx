import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eur } from "@/lib/format";
import { formatDateFr } from "@/lib/time";
import { Badge, Card, LinkButton, PageHead, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ClientDetail({ params }: { params: { id: string } }) {
  const c = await db.customer.findUnique({
    where: { id: params.id },
    include: { bookings: { orderBy: [{ date: "desc" }, { startMin: "desc" }] } },
  });
  if (!c) notFound();
  const last = c.bookings.find((b) => ["CONFIRMED", "COMPLETED"].includes(b.status));
  return (
    <>
      <PageHead
        title={c.name}
        sub={`${c.email} · ${c.phone}`}
        action={last ? <LinkButton href={`/admin/rendez-vous/nouveau?from=${last.id}`}>RÉSERVER À NOUVEAU</LinkButton> : <LinkButton href={`/admin/rendez-vous/nouveau?customerId=${c.id}`}>+ NOUVEAU RENDEZ-VOUS</LinkButton>}
      />
      <Card title="Historique">
        <Table head={["Date", "Service", "Montant", "Statut", ""]} empty={c.bookings.length ? undefined : "Aucun rendez-vous."}>
          {c.bookings.map((b) => (
            <tr key={b.id}>
              <td className="whitespace-nowrap px-4 py-3">{formatDateFr(b.date, false)} · {b.startTime}</td>
              <td className="px-4 py-3">{b.itemName}{b.variantLabel ? ` — ${b.variantLabel}` : ""}</td>
              <td className="px-4 py-3">{eur(b.totalAmount)}</td>
              <td className="px-4 py-3"><Badge status={b.status} /></td>
              <td className="px-4 py-3 text-right"><Link className="underline" href={`/admin/rendez-vous/${b.id}`}>Ouvrir</Link></td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
