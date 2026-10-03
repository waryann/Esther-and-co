import Link from "next/link";
import { db } from "@/lib/db";
import { saveService } from "@/app/admin/actions";
import { eur } from "@/lib/format";
import { Card, Field, Flash, PageHead, Submit, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ServicesAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const services = await db.service.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHead title="Prestations" sub="Services individuels. Acompte par défaut : 20 €. Les durées sont des valeurs provisoires à confirmer." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <Table head={["Prestation", "Prix", "Acompte", "Durée", "Statut", ""]}>
        {services.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-3">{s.name}</td>
            <td className="px-4 py-3">{s.priceFrom ? "dès " : ""}{eur(s.price)}</td>
            <td className="px-4 py-3">{eur(s.depositAmount)}</td>
            <td className="px-4 py-3">{s.durationMinutes} min</td>
            <td className="px-4 py-3"><span className={s.active ? "text-green-700" : "text-neutral-500"}>{s.active ? "Actif" : "Désactivé"}</span></td>
            <td className="px-4 py-3 text-right"><Link className="underline" href={`/admin/prestations/${s.id}`}>Modifier</Link></td>
          </tr>
        ))}
      </Table>
      <Card title="Créer une prestation" className="mt-6 max-w-2xl">
        <form action={saveService} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom" name="name" required className="sm:col-span-2" />
          <Field label="Prix (€)" name="price" type="number" min={0} required />
          <Field label="Acompte (€)" name="depositAmount" type="number" min={0} defaultValue={20} />
          <Field label="Durée (minutes)" name="durationMinutes" type="number" min={15} step={15} defaultValue={120} />
          <Field label="Ordre" name="sortOrder" type="number" defaultValue={services.length + 1} />
          <input type="hidden" name="active" value="on" /><input type="hidden" name="priceFrom" value="on" />
          <div className="sm:col-span-2"><Submit>Créer la prestation</Submit></div>
        </form>
      </Card>
    </>
  );
}
