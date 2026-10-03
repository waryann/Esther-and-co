"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Droplet, Heart, Scissors, Sparkles, Waves } from "lucide-react";
import { useBooking } from "@/components/BookingProvider";
import { ErrorBox, Spinner, useStepGuard } from "@/components/Steps";
import { api, track } from "@/lib/client";
import { eur } from "@/lib/format";

type Opt = { id: string; name: string; description: string; price: number; icon: string; image: string };

const ICONS: Record<string, React.ReactNode> = {
  droplet: <Droplet size={22} strokeWidth={1.3} />,
  scissors: <Scissors size={22} strokeWidth={1.3} />,
  waves: <Waves size={22} strokeWidth={1.3} />,
  heart: <Heart size={22} strokeWidth={1.3} />,
  sparkles: <Sparkles size={22} strokeWidth={1.3} />,
};

export default function OptionsPage() {
  const router = useRouter();
  const { update } = useBooking();
  const { ready, sel } = useStepGuard("item");
  const [options, setOptions] = useState<Opt[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sel) return;
    api<{ options: Opt[] }>(`/api/booking/options?type=${sel.type}`).then((r) => {
      const opts = r.data?.options ?? [];
      setOptions(opts);
      if (!opts.length) router.replace("/reservation/date");
    });
  }, [sel?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sel) return;
    api("/api/booking/quote", {
      method: "POST",
      body: JSON.stringify({ type: sel.type, itemId: sel.itemId, variantId: sel.variantId, optionIds: sel.optionIds }),
    }).then((r) => {
      if (r.ok) {
        setTotal(r.data.quote.total);
        setError("");
      } else setError(r.data?.error ?? "Sélection invalide.");
    });
  }, [sel?.itemId, sel?.variantId, sel?.optionIds?.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !sel || !options) return <Spinner />;

  const toggle = (id: string) => {
    const on = sel.optionIds.includes(id);
    update({ optionIds: on ? sel.optionIds.filter((x) => x !== id) : [...sel.optionIds, id], date: null, time: null });
    if (!on) track("option_selected", { id });
  };

  return (
    <div className="container-page max-w-2xl py-8 pb-32 md:pb-12">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-[12px] text-taupe"><ArrowLeft size={14} /> Retour</button>
      <h1 className="h-display text-[30px] md:text-[36px]">
        {sel.type === "PACKAGE" ? "Personnalisez votre pack" : "Options supplémentaires"}
      </h1>
      <p className="mt-2 text-[13.5px] text-[#555]">
        {sel.type === "PACKAGE" ? "Ajoutez des options selon vos besoins." : "Personnalisez votre prestation selon vos besoins."}
      </p>

      <ul className="mt-6 space-y-2.5">
        {options.map((o, i) => {
          const on = sel.optionIds.includes(o.id);
          return (
            <li key={o.id} style={{ animationDelay: `${i * 70}ms` }} className="card flex animate-fade-up items-center gap-4 px-3 py-3.5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden bg-sand text-taupe">
                {o.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={o.image} alt="" className="h-full w-full object-cover" /> : ICONS[o.icon] ?? ICONS.sparkles}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium leading-tight">{o.name}</div>
                <div className="mt-0.5 text-[12px] text-[#777]">{o.description}</div>
              </div>
              <div className="text-[14px]">+{eur(o.price)}</div>
              <button
                role="switch"
                aria-checked={on}
                aria-label={o.name}
                onClick={() => toggle(o.id)}
                className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition ${on ? "bg-ink" : "bg-[#d9d2c8]"}`}
              >
                <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[23px]" : "left-[3px]"}`} />
              </button>
            </li>
          );
        })}
      </ul>

      {error && <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 px-5 py-3 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-2xl">
          {total !== null && (
            <div className="mb-2 flex items-baseline justify-between text-[13px]">
              <span className="text-[#666]">{sel.itemName}{sel.variantLabel ? ` — ${sel.variantLabel}` : ""}</span>
              <span className="font-medium">Total : {eur(total)}</span>
            </div>
          )}
          <button className="btn-dark" disabled={!!error} onClick={() => router.push("/reservation/date")}>
            CONTINUER <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
