import Link from "next/link";
import { db } from "@/lib/db";
import { savePackage } from "@/app/admin/actions";
import { eur } from "@/lib/format";
import { Badge, Card, Field, Flash, PageHead, Submit, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function PacksAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const packs = await db.package.findMany({ orderBy: { sortOrder: "asc" }, include: { variants: true } });
  return (
    <>
      <PageHead title="Packs" sub="Mèches + prestation incluses. Acompte par défaut : 50 €." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <Table head={["Pack", "Prix", "Variantes", "Acompte", "Durée", "Statut", ""]}>
        {packs.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3">{p.name}</td>
            <td className="px-4 py-3">{p.variants.length ? `dès ${eur(Math.min(...p.variants.map((v) => v.price)))}` : eur(p.basePrice)}</td>
            <td className="px-4 py-3">{p.variants.length || "—"}</td>
            <td className="px-4 py-3">{eur(p.depositAmount)}</td>
            <td className="px-4 py-3">{p.durationMinutes} min</td>
            <td className="px-4 py-3"><span className={p.active ? "text-green-700" : "text-neutral-500"}>{p.active ? "Actif" : "Désactivé"}</span></td>
            <td className="px-4 py-3 text-right"><Link className="underline" href={`/admin/packs/${p.id}`}>Modifier</Link></td>
          </tr>
        ))}
      </Table>
      <Card title="Créer un pack" className="mt-6 max-w-2xl">
        <form action={savePackage} className="grid gap-3 sm:grid-cols-2">
          <Field label="Nom" name="name" required className="sm:col-span-2" />
          <Field label="Prix de base (€)" name="basePrice" type="number" min={0} required />
          <Field label="Acompte (€)" name="depositAmount" type="number" min={0} defaultValue={50} />
          <Field label="Durée (minutes)" name="durationMinutes" type="number" min={15} step={15} defaultValue={180} />
          <Field label="Ordre d'affichage" name="sortOrder" type="number" defaultValue={packs.length + 1} />
          <input type="hidden" name="active" value="on" />
          <div className="sm:col-span-2"><Submit>Créer le pack</Submit></div>
        </form>
      </Card>
    </>
  );
}
