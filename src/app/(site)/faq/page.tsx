import { Plus } from "lucide-react";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQ | ESTHAIR & CO.", description: "Questions fréquentes sur les packs, les acomptes et la réservation." };

export default async function FaqPage() {
  const items = await db.faqItem.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="container-page max-w-2xl py-8 md:py-12">
      <h1 className="page-title">FAQ</h1>
      <p className="mt-3 text-center text-[13px] text-[#555]">Les réponses à vos questions les plus fréquentes.</p>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {items.map((f) => (
          <details key={f.id} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px]">
              {f.question}
              <Plus size={18} strokeWidth={1.4} className="shrink-0 transition group-open:rotate-45" />
            </summary>
            <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-[#444]">{f.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
