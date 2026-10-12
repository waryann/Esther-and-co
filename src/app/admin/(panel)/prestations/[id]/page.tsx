import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { saveService } from "@/app/admin/actions";
import { Card, Check, Field, Flash, ImageField, PageHead, Submit, TextArea } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ServiceEdit({ params, searchParams }: { params: { id: string }; searchParams: { msg?: string; error?: string } }) {
  const s = await db.service.findUnique({ where: { id: params.id } });
  if (!s) notFound();
  return (
    <>
      <PageHead title={s.name} sub={`/prestations/${s.slug}`} />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <Card className="max-w-2xl">
        <form action={saveService} className="space-y-3">
          <input type="hidden" name="id" value={s.id} />
          <Field label="Nom" name="name" defaultValue={s.name} required />
          <Field label="Slug (URL)" name="slug" defaultValue={s.slug} />
          <TextArea label="Description" name="description" defaultValue={s.description} />
          <TextArea label="Points clés (une ligne par élément)" name="features" defaultValue={s.features.replace(/\|/g, "\n")} rows={4} hint={"**gras** possible. {duration} = durée de la prestation (ex. « Durabilité **{duration}** » → 2 heures)."} />
          <TextArea label="Informations importantes (une note par ligne : icone|texte)" name="infoNotes" defaultValue={s.infoNotes} rows={7} hint={"Icônes : calendar, braids, shower, dryer, clock. **gras** possible, {duration} = durée. Une ligne sans icône continue la note précédente."} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prix (€)" name="price" type="number" defaultValue={s.price} />
            <Field label="Acompte (€)" name="depositAmount" type="number" defaultValue={s.depositAmount} />
            <Field label="Durée (minutes)" name="durationMinutes" type="number" step={15} defaultValue={s.durationMinutes} />
            <Field label="Ordre" name="sortOrder" type="number" defaultValue={s.sortOrder} />
          </div>
          <Check label={'Afficher « À partir de »'} name="priceFrom" defaultChecked={s.priceFrom} />
          <ImageField label="Photo" current={s.image} />
          <Field label="SEO — titre" name="seoTitle" defaultValue={s.seoTitle} />
          <TextArea label="SEO — meta description" name="seoDescription" defaultValue={s.seoDescription} rows={2} />
          <Check label="Actif (visible et réservable)" name="active" defaultChecked={s.active} />
          <Submit>Enregistrer</Submit>
        </form>
      </Card>
    </>
  );
}
