import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteVariant, savePackage, saveVariant } from "@/app/admin/actions";
import { Card, Check, Field, Flash, ImageField, PageHead, Submit, TextArea } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function PackEdit({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string; error?: string } }) {
  const p = await db.package.findUnique({ where: { id: params.id }, include: { variants: { orderBy: { sortOrder: "asc" } } } });
  if (!p) notFound();
  return (
    <>
      <PageHead title={p.name} sub={`/packs/${p.slug}`} />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Pack">
          <form action={savePackage} className="space-y-3">
            <input type="hidden" name="id" value={p.id} />
            <Field label="Nom" name="name" defaultValue={p.name} required />
            <Field label="Slug (URL)" name="slug" defaultValue={p.slug} />
            <Field label="Sous-titre" name="shortDescription" defaultValue={p.shortDescription} />
            <TextArea label="Description" name="description" defaultValue={p.description} />
            <TextArea label="Ce qui est inclus (une ligne par élément)" name="features" defaultValue={p.features.replace(/\|/g, "\n")} rows={4} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prix de base (€)" name="basePrice" type="number" defaultValue={p.basePrice} hint="Utilisé si le pack n'a pas de variante" />
              <Field label="Acompte (€)" name="depositAmount" type="number" defaultValue={p.depositAmount} />
              <Field label="Durée (minutes)" name="durationMinutes" type="number" step={15} defaultValue={p.durationMinutes} />
              <Field label="Ordre" name="sortOrder" type="number" defaultValue={p.sortOrder} />
            </div>
            <ImageField label="Photo" current={p.image} />
            <Field label="SEO — titre" name="seoTitle" defaultValue={p.seoTitle} />
            <TextArea label="SEO — meta description" name="seoDescription" defaultValue={p.seoDescription} rows={2} />
            <Check label="Actif (visible et réservable)" name="active" defaultChecked={p.active} />
            <Submit>Enregistrer</Submit>
          </form>
        </Card>

        <Card title="Variantes (longueurs / paquets)">
          <p className="mb-4 text-[12.5px] text-[#777]">Le prix de la variante remplace le prix de base. Ajoutez une longueur à tout moment, sans toucher au code.</p>
          <div className="space-y-3">
            {p.variants.map((v) => (
              <div key={v.id} className="border border-line p-3">
                <form action={saveVariant} className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="packageId" value={p.id} />
                  <Field label="Libellé" name="label" defaultValue={v.label} className="col-span-2" />
                  <Field label="Paquets" name="bundles" type="number" defaultValue={v.bundles} />
                  <Field label='Pouces' name="length" type="number" defaultValue={v.length} />
                  <Field label="Prix (€)" name="price" type="number" defaultValue={v.price} />
                  <Field label="Ordre" name="sortOrder" type="number" defaultValue={v.sortOrder} />
                  <div className="col-span-2 flex items-center gap-4 sm:col-span-6">
                    <Check label="Active" name="active" defaultChecked={v.active} />
                    <Submit className="!py-2">Enregistrer</Submit>
                  </div>
                </form>
                <form action={deleteVariant} className="mt-2">
                  <input type="hidden" name="id" value={v.id} /><input type="hidden" name="packageId" value={p.id} />
                  <button className="text-[12px] text-red-700 underline">Supprimer cette variante</button>
                </form>
              </div>
            ))}
          </div>
          <form action={saveVariant} className="mt-5 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-5">
            <input type="hidden" name="packageId" value={p.id} />
            <Field label="Nouvelle variante" name="label" placeholder='3 paquets 22"' required className="col-span-2" />
            <Field label="Paquets" name="bundles" type="number" defaultValue={3} />
            <Field label="Pouces" name="length" type="number" />
            <Field label="Prix (€)" name="price" type="number" required />
            <input type="hidden" name="sortOrder" value={p.variants.length + 1} />
            <div className="col-span-2 sm:col-span-5"><Submit>Ajouter la variante</Submit></div>
          </form>
        </Card>
      </div>
    </>
  );
}
