"use client";

import { useRef, useState } from "react";
import { Star } from "lucide-react";
import { Photo } from "./Photo";
import { Reveal } from "./Reveal";

export type ReviewLite = { id: string; firstName: string; rating: number; comment: string; photo: string };

export function Stars({ n }: { n: number }) {
  return (
    <div className="flex justify-center gap-0.5 text-[#c8863b]" aria-label={`${n} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < n ? "currentColor" : "none"} strokeWidth={1.4} />
      ))}
    </div>
  );
}

export function ReviewCard({ r }: { r: ReviewLite }) {
  return (
    <figure className="flex h-full flex-col bg-white">
      <Photo src={r.photo} className="aspect-[4/3] md:aspect-[3/4]" />
      <figcaption className="flex flex-1 flex-col items-center gap-2 px-4 pb-5 pt-4 text-center">
        <Stars n={r.rating} />
        <blockquote className="text-[13.5px] leading-snug text-[#333]">« {r.comment} »</blockquote>
        <div className="mt-auto pt-1 text-[12px] italic text-[#666]">{r.firstName}</div>
      </figcaption>
    </figure>
  );
}

/** Mobile : carrousel à défilement + points. Desktop : grille. */
export function ReviewsCarousel({ reviews }: { reviews: ReviewLite[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  return (
    <>
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIdx(Math.round(el.scrollLeft / (el.firstElementChild?.clientWidth || 1)));
        }}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:hidden"
      >
        {reviews.map((r) => (
          <div key={r.id} className="w-full shrink-0 snap-center">
            <ReviewCard r={r} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2 md:hidden" aria-hidden>
        {reviews.map((r, i) => (
          <span key={r.id} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-ink" : "bg-[#d4cabc]"}`} />
        ))}
      </div>
      <div className="hidden grid-cols-2 gap-5 md:grid lg:grid-cols-4">
        {reviews.map((r, i) => <Reveal key={r.id} delay={(i % 4) * 100} className="h-full"><ReviewCard r={r} /></Reveal>)}
      </div>
    </>
  );
}
