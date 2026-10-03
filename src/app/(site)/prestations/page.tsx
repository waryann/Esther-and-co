import { ServiceCard } from "@/components/Cards";
import { getActiveServices } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nos prestations | ESTHAIR & CO.", description: "Pose perruque, tissage ouvert, flipover, pony lace… choisissez la prestation qui vous correspond." };

export default async function PrestationsPage() {
  const services = await getActiveServices();
  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="page-title">Nos prestations</h1>
      <p className="mt-3 text-center text-[13px] text-[#555]">Choisissez la prestation qui vous correspond.</p>
      <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-2 md:hidden">{services.map((s, i) => <ServiceCard key={s.id} s={s} i={i} />)}</div>
      <div className="mt-8 hidden grid-cols-3 gap-5 md:grid lg:grid-cols-6">{services.map((s, i) => <ServiceCard key={s.id} s={s} desktop i={i} />)}</div>
    </div>
  );
}
