import { db } from "@/lib/db";
import { deleteOption, saveOption } from "@/app/admin/actions";
import { Card, Check, Field, Flash, ImageField, PageHead, Select, Submit } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function OptionFields({ o }: { o?: { name: string; description: string; priceModifier: number; scope: string; sortOrder: number; image: string } }) {
  return (
    <>
      <Field label="Nom" name="name" defaultValue={o?.name} required />
      <Field label="Description" name="description" defaultValue={o?.description} />
      <Field label="Supplément (€)" name="priceModifier" type="number" defaultValue={o?.priceModifier} required />
      <Select label="S'applique à" name="scope" defaultValue={o?.scope ?? "PACKAGE"}>
        <option value="PACKAGE">Packs</option>
        <option value="SERVICE">Prestations</option>
        <option value="BOTH">Packs et prestations</option>
      </Select>
      <Field label="Ordre" name="sortOrder" type="number" defaultValue={o?.sortOrder} />
    </>
  );
}

export default async function OptionsAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const options = await db.serviceOption.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHead title="Options" sub="Coloration, coupe, soin… Le prix final se recalcule automatiquement." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <div className="space-y-3">
        {options.map((o) => (
          <Card key={o.id}>
            <form action={saveOption} className="grid items-end gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <input type="hidden" name="id" value={o.id} />
              <OptionFields o={o} />
              <div className="space-y-2">
                <Check label="Active" name="active" defaultChecked={o.active} />
                <Submit className="!py-2">Enregistrer</Submit>
              </div>
              <div className="sm:col-span-3 lg:col-span-6"><ImageField label="Image (facultatif, remplace l'icône)" current={o.image} /></div>
            </form>
            <form action={deleteOption} className="mt-2"><input type="hidden" name="id" value={o.id} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form>
          </Card>
        ))}
      </div>
      <Card title="Ajouter une option" className="mt-6">
        <form action={saveOption} className="grid items-end gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <OptionFields />
          <Submit className="!py-2.5">Ajouter</Submit>
        </form>
      </Card>
    </>
  );
}
