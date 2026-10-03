import { db } from "@/lib/db";
import { savePost } from "@/app/admin/actions";
import { Card, Field, ImageField, Select, Submit, TextArea } from "@/components/admin/ui";

type Post = { id: string; title: string; slug: string; excerpt: string; coverImage: string; content: string; categoryId: string | null; author: string; status: string; ctaLabel: string; ctaHref: string };

export async function PostForm({ post }: { post?: Post }) {
  const cats = await db.blogCategory.findMany({ orderBy: { name: "asc" } });
  return (
    <Card className="max-w-3xl">
      <form action={savePost} className="space-y-3">
        {post && <input type="hidden" name="id" value={post.id} />}
        <Field label="Titre" name="title" defaultValue={post?.title} required />
        {post && <Field label="Slug (URL)" name="slug" defaultValue={post.slug} hint={`/blog/${post.slug}`} />}
        <div className="grid grid-cols-3 gap-3">
          <Select label="Catégorie" name="categoryId" defaultValue={post?.categoryId ?? ""}>
            <option value="">—</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Field label="Auteur" name="author" defaultValue={post?.author ?? "Esther"} />
          <Select label="Statut" name="status" defaultValue={post?.status ?? "DRAFT"}>
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="ARCHIVED">Archivé</option>
          </Select>
        </div>
        <TextArea label="Résumé" name="excerpt" defaultValue={post?.excerpt} rows={2} />
        <ImageField label="Image de couverture" name="coverImage" current={post?.coverImage} />
        <TextArea label="Contenu" name="content" defaultValue={post?.content} rows={16} hint={'Paragraphes séparés par une ligne vide. Un titre de section commence par "## ".'} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bouton d'appel à l'action — texte" name="ctaLabel" defaultValue={post?.ctaLabel} placeholder="RÉSERVER MON FLIPOVER" />
          <Field label="Bouton — lien" name="ctaHref" defaultValue={post?.ctaHref} placeholder="/packs/flipover" hint="Génère du trafic vers la réservation" />
        </div>
        <Submit>Enregistrer</Submit>
      </form>
    </Card>
  );
}
