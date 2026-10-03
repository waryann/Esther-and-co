import { db } from "@/lib/db";
import { deleteFaq, saveFaq } from "@/app/admin/actions";
import { Card, Check, Field, Flash, PageHead, Submit, TextArea } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function FaqAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const items = await db.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHead title="FAQ" sub="Questions / réponses affichées en accordéon sur /faq." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <div className="space-y-3">
        {items.map((f) => (
          <Card key={f.id}>
            <form action={saveFaq} className="space-y-3">
              <input type="hidden" name="id" value={f.id} />
              <Field label="Question" name="question" defaultValue={f.question} />
              <TextArea label="Réponse" name="answer" defaultValue={f.answer} rows={3} />
              <div className="flex flex-wrap items-end gap-4">
                <Field label="Ordre" name="sortOrder" type="number" defaultValue={f.sortOrder} className="w-24" />
                <Check label="Visible" name="active" defaultChecked={f.active} />
                <Submit className="!py-2">Enregistrer</Submit>
              </div>
            </form>
            <form action={deleteFaq} className="mt-2"><input type="hidden" name="id" value={f.id} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form>
          </Card>
        ))}
      </div>
      <Card title="Ajouter une question" className="mt-6">
        <form action={saveFaq} className="space-y-3">
          <Field label="Question" name="question" required />
          <TextArea label="Réponse" name="answer" rows={3} />
          <Field label="Ordre" name="sortOrder" type="number" defaultValue={items.length + 1} className="w-24" />
          <Submit>Ajouter</Submit>
        </form>
      </Card>
    </>
  );
}
