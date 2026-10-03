import { PackCard } from "@/components/Cards";
import { getActivePackages } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nos packs | ESTHAIR & CO.", description: "Des packs complets, mèches + prestation incluses, pour un résultat naturel, rapide et sans colle." };

export default async function PacksPage() {
  const packs = await getActivePackages();
  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="page-title">Nos packs</h1>
      <p className="mt-2 text-center font-serif text-[18px] text-[#555]">Mèches + prestation incluses</p>
      <p className="mx-auto mt-2 max-w-sm text-center text-[12.5px] text-[#666]">
        Des packs complets pour un résultat naturel, rapide et sans colle.
      </p>
      <div className="mx-auto mt-6 max-w-xl space-y-3 md:hidden">{packs.map((p, i) => <PackCard key={p.id} p={p} i={i} />)}</div>
      <div className="mt-8 hidden grid-cols-3 gap-5 md:grid">{packs.map((p, i) => <PackCard key={p.id} p={p} desktop i={i} />)}</div>
    </div>
  );
}
