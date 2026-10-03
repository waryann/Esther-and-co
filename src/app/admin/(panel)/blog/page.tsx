import Link from "next/link";
import { db } from "@/lib/db";
import { addCategory, deletePost } from "@/app/admin/actions";
import { Badge, Card, Field, Flash, LinkButton, PageHead, Submit, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function BlogAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const [posts, cats] = await Promise.all([
    db.blogPost.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } }),
    db.blogCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <>
      <PageHead title="Blog" action={<LinkButton href="/admin/blog/nouveau">+ NOUVEL ARTICLE</LinkButton>} />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <Table head={["Titre", "Catégorie", "Statut", "Publié le", ""]} empty={posts.length ? undefined : "Aucun article."}>
        {posts.map((p) => (
          <tr key={p.id}>
            <td className="px-4 py-3">{p.title}</td>
            <td className="px-4 py-3">{p.category?.name ?? "—"}</td>
            <td className="px-4 py-3"><Badge status={p.status} /></td>
            <td className="px-4 py-3">{p.publishedAt?.toLocaleDateString("fr-BE") ?? "—"}</td>
            <td className="flex items-center justify-end gap-4 px-4 py-3">
              <Link className="underline" href={`/admin/blog/${p.id}`}>Modifier</Link>
              <form action={deletePost}><input type="hidden" name="id" value={p.id} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form>
            </td>
          </tr>
        ))}
      </Table>
      <Card title="Catégories" className="mt-6 max-w-xl">
        <p className="mb-3 text-[13.5px]">{cats.map((c) => c.name).join(" · ")}</p>
        <form action={addCategory} className="flex items-end gap-3"><Field label="Nouvelle catégorie" name="name" className="flex-1" /><Submit className="!py-2.5">Ajouter</Submit></form>
      </Card>
    </>
  );
}
