import Link from "next/link";
import { ReviewsCarousel } from "@/components/ReviewCards";
import { ReviewForm } from "@/components/ReviewForm";
import { PageView } from "@/components/PageView";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Avis clientes | ESTHAIR & CO.", description: "Elles nous font confiance : découvrez les avis de nos clientes." };

export default async function ReviewsPage({ searchParams }: { searchParams: { tout?: string } }) {
  const all = searchParams.tout === "1";
  const reviews = await db.review.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: all ? 200 : 8,
  });
  const total = await db.review.count({ where: { status: "APPROVED" } });
  return (
    <div className="container-page py-8 md:py-12">
      <PageView event="page_view" props={{ page: "reviews" }} />
      <h1 className="h-display text-center text-[32px] md:text-[40px]">Elles nous font confiance</h1>
      <div className="mt-6">
        {reviews.length === 0 ? (
          <p className="text-center text-[13px] text-[#777]">Les premiers avis arrivent bientôt.</p>
        ) : (
          <ReviewsCarousel reviews={reviews.map((r) => ({ id: r.id, firstName: r.firstName, rating: r.rating, comment: r.comment, photo: r.photo }))} />
        )}
      </div>
      {!all && total > reviews.length && (
        <Link href="/avis?tout=1" className="btn-dark btn-auto mx-auto mt-6 !px-10 max-md:w-full">VOIR PLUS D&apos;AVIS →</Link>
      )}

      <section className="mx-auto mt-14 max-w-md" id="laisser-un-avis">
        <h2 className="h-display text-center text-[26px]">Laisser un avis</h2>
        <p className="mb-5 mt-2 text-center text-[13px] text-[#555]">Votre avis sera publié après validation.</p>
        <ReviewForm />
      </section>
    </div>
  );
}
