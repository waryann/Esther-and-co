import Link from "next/link";
import { db } from "@/lib/db";
import { markPaymentRefunded } from "@/app/admin/actions";
import { eur } from "@/lib/format";
import { Badge, Flash, PageHead, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function PaymentsAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const payments = await db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { booking: { include: { customer: true } } } });
  const total = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);
  return (
    <>
      <PageHead title="Paiements" sub={`Total encaissé (acomptes) : ${eur(total)} — la confirmation vient uniquement du webhook du prestataire.`} />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <Table head={["Date", "Réservation", "Cliente", "Montant", "Prestataire / réf.", "Statut", "Preuve Insta", ""]} empty={payments.length ? undefined : "Aucun paiement."}>
        {payments.map((p) => (
          <tr key={p.id}>
            <td className="whitespace-nowrap px-4 py-3">{(p.paidAt ?? p.createdAt).toLocaleString("fr-BE")}</td>
            <td className="px-4 py-3"><Link className="underline" href={`/admin/rendez-vous/${p.bookingId}`}>{p.booking.reference}</Link></td>
            <td className="px-4 py-3">{p.booking.customer.name}</td>
            <td className="px-4 py-3">{eur(p.amount)}</td>
            <td className="px-4 py-3 text-[12px] text-[#777]">{p.provider} · {p.providerRef || "—"}</td>
            <td className="px-4 py-3"><Badge status={p.status} />{p.needsRefund && <span className="ml-2 text-[11px] font-medium text-red-700">à rembourser</span>}</td>
            <td className="px-4 py-3">{p.booking.paymentScreenshotSent ? "Oui" : "Non"}</td>
            <td className="px-4 py-3">
              {p.status === "PAID" && <form action={markPaymentRefunded}><input type="hidden" name="id" value={p.id} /><button className="text-[12px] underline">Marquer remboursé</button></form>}
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
