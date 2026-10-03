import { db } from "@/lib/db";
import { deleteSubscriber } from "@/app/admin/actions";
import { Flash, LinkButton, PageHead, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewsletterAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const subs = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHead title="Newsletter" sub={`${subs.length} abonnée(s)`} action={<LinkButton href="/admin/newsletter/export">EXPORT CSV</LinkButton>} />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <Table head={["Email", "Inscrite le", ""]} empty={subs.length ? undefined : "Aucune abonnée."}>
        {subs.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-3">{s.email}</td>
            <td className="px-4 py-3">{s.createdAt.toLocaleDateString("fr-BE")}</td>
            <td className="px-4 py-3 text-right"><form action={deleteSubscriber}><input type="hidden" name="id" value={s.id} /><button className="text-[12px] text-red-700 underline">Supprimer</button></form></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
