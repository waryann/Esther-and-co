import { db } from "@/lib/db";
import { reviewAction } from "@/app/admin/actions";
import { Badge, Flash, PageHead, Submit } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

function Btn({ id, action, label, danger }: { id: string; action: string; label: string; danger?: boolean }) {
  return (
    <form action={reviewAction}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="action" value={action} />
      <Submit danger={danger} className="!px-3 !py-1.5">{label}</Submit>
    </form>
  );
}

export default async function ReviewsAdmin({ searchParams }: { searchParams: { msg?: string; error?: string } }) {
  const reviews = await db.review.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <>
      <PageHead title="Avis" sub="Un avis n'est public qu'une fois approuvé. Workflow : PENDING → APPROVED." />
      <Flash msg={searchParams.msg} error={searchParams.error} />
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="flex flex-wrap items-start justify-between gap-4 border border-line bg-white p-4">
            <div className="flex gap-4">
              {r.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.photo} alt="" className="h-20 w-20 object-cover" /> : null}
              <div>
                <div className="text-[14px] font-medium">{r.firstName} <span className="text-[#c8863b]">{"★".repeat(r.rating)}</span></div>
                <p className="mt-1 max-w-xl text-[13.5px] text-[#444]">{r.comment}</p>
                <p className="mt-1 text-[11.5px] text-[#888]">
                  {r.createdAt.toLocaleDateString("fr-BE")}
                  {r.photo && (r.photoConsent ? ` · consentement photo enregistré le ${r.consentAt?.toLocaleDateString("fr-BE")}` : " · ⚠ pas de consentement")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge status={r.status} />
              {r.status !== "APPROVED" && <Btn id={r.id} action="approve" label="Approuver" />}
              {r.status !== "REJECTED" && <Btn id={r.id} action="reject" label="Refuser" danger />}
              <Btn id={r.id} action="delete" label="Supprimer" danger />
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-[13px] text-[#888]">Aucun avis.</p>}
      </div>
    </>
  );
}
