"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useBooking } from "@/components/BookingProvider";
import { ErrorBox, Spinner, useStepGuard } from "@/components/Steps";
import { api, track } from "@/lib/client";
import { DAYS_SHORT_FR, MONTHS_FR, daysInMonth, pad } from "@/lib/time";

const HEAD = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function DatePage() {
  const router = useRouter();
  const { update } = useBooking();
  const { ready, sel } = useStepGuardItem();
  const [cursor, setCursor] = useState<{ y: number; m: number } | null>(null);
  const [days, setDays] = useState<Set<string>>(new Set());
  const [today, setToday] = useState("");
  const [maxDate, setMaxDate] = useState("9999-12-31");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMonth = useCallback(
    async (y: number, m: number, autoAdvance = false, tries = 0): Promise<void> => {
      if (!sel) return;
      setLoading(true);
      const r = await api<{ days: string[]; today: string; maxDate: string; error?: string }>(
        `/api/availability?type=${sel.type}&itemId=${sel.itemId}&month=${y}-${pad(m + 1)}`,
      );
      if (!r.ok) {
        setError(r.data?.error ?? "Impossible de charger les disponibilités.");
        setLoading(false);
        return;
      }
      setError("");
      setToday(r.data.today);
      setMaxDate(r.data.maxDate);
      if (autoAdvance && r.data.days.length === 0 && tries < 4) {
        const ny = m === 11 ? y + 1 : y;
        const nm = (m + 1) % 12;
        if (`${ny}-${pad(nm + 1)}-01` <= r.data.maxDate) return loadMonth(ny, nm, true, tries + 1);
      }
      setCursor({ y, m });
      setDays(new Set(r.data.days));
      setLoading(false);
    },
    [sel?.itemId, sel?.type], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (!ready || !sel) return;
    if (sel.date && sel.time) {
      setDate(sel.date);
      setTime(sel.time);
      const [y, m] = sel.date.split("-").map(Number);
      loadMonth(y, m - 1);
      return;
    }
    const now = new Date();
    loadMonth(now.getFullYear(), now.getMonth(), true);
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!date || !sel) return;
    setSlots(null);
    api<{ slots: string[]; error?: string }>(`/api/availability/slots?type=${sel.type}&itemId=${sel.itemId}&date=${date}`).then((r) => {
      if (!r.ok) return void setError(r.data?.error ?? "Erreur.");
      setSlots(r.data.slots);
      if (time && !r.data.slots.includes(time)) setTime(null);
    });
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !sel || !cursor) return <>{error ? <div className="container-page py-10"><ErrorBox>{error}</ErrorBox></div> : <Spinner />}</>;

  const first = new Date(Date.UTC(cursor.y, cursor.m, 1)).getUTCDay(); // 0 = dim
  const offset = (first + 6) % 7; // lundi = 0
  const total = daysInMonth(cursor.y, cursor.m);
  const monthKey = `${cursor.y}-${pad(cursor.m + 1)}`;
  const canPrev = monthKey > today.slice(0, 7);
  const canNext = `${cursor.m === 11 ? cursor.y + 1 : cursor.y}-${pad(((cursor.m + 1) % 12) + 1)}-01` <= maxDate;

  const shift = (d: number) => {
    let m = cursor.m + d;
    let y = cursor.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setDate(null); setTime(null); setSlots(null);
    loadMonth(y, m);
  };

  const pickDate = (d: string) => {
    setDate(d);
    setTime(null);
    track("date_selected", { date: d });
  };

  const next = () => {
    if (!date || !time) return;
    update({ date, time, bookingToken: sel.bookingToken });
    router.push("/reservation/informations");
  };

  return (
    <div className="container-page max-w-4xl py-8 pb-32 md:pb-12">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-[12px] text-taupe"><ArrowLeft size={14} /> Retour</button>
      <h1 className="h-display text-[30px] md:text-[36px]">Choisissez votre date et heure</h1>

      {error && <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>}

      <div className="mt-6 md:grid md:grid-cols-[1fr_220px] md:gap-8">
        <div>
          <div className="card px-4 pb-5 pt-4">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={() => shift(-1)} disabled={!canPrev} aria-label="Mois précédent" className="flex h-9 w-9 items-center justify-center disabled:opacity-25"><ChevronLeft size={18} /></button>
              <div className="font-serif text-[18px] capitalize">{MONTHS_FR[cursor.m]} {cursor.y}</div>
              <button onClick={() => shift(1)} disabled={!canNext} aria-label="Mois suivant" className="flex h-9 w-9 items-center justify-center disabled:opacity-25"><ChevronRight size={18} /></button>
            </div>
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {HEAD.map((h) => <div key={h} className="pb-2 text-[10.5px] text-[#999]">{h}</div>)}
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: total }, (_, i) => i + 1).map((d) => {
                const ds = `${monthKey}-${pad(d)}`;
                const avail = days.has(ds);
                const selected = date === ds;
                return (
                  <div key={ds} className="flex justify-center">
                    <button
                      disabled={!avail || loading}
                      onClick={() => pickDate(ds)}
                      aria-label={ds}
                      aria-pressed={selected}
                      className={`cal-day ${selected ? "bg-ink font-medium text-white" : avail ? "text-ink hover:bg-sand" : "text-[#c9c2b8]"}`}
                    >
                      {d}
                    </button>
                  </div>
                );
              })}
            </div>
            {!loading && days.size === 0 && <p className="mt-4 text-center text-[12.5px] text-[#777]">Aucune disponibilité ce mois-ci.</p>}
          </div>
        </div>

        <div className="mt-6 md:mt-0">
          <h2 className="mb-3 font-serif text-[18px] md:text-[15px] md:font-sans md:font-medium">Créneaux disponibles</h2>
          {!date ? (
            <p className="text-[13px] text-[#777]">Sélectionnez un jour pour voir les horaires.</p>
          ) : slots === null ? (
            <p className="text-[13px] text-[#777]">Chargement…</p>
          ) : slots.length === 0 ? (
            <p className="text-[13px] text-[#777]">Aucun créneau disponible ce jour-là.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1">
              {slots.map((t, i) => (
                <button
                  key={t}
                  style={{ animationDelay: `${i * 45}ms` }}
                  onClick={() => setTime(t)}
                  aria-pressed={time === t}
                  className={`animate-fade-up border py-3.5 text-[14px] transition ${time === t ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream/95 px-5 py-3 backdrop-blur md:static md:mt-8 md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto max-w-4xl md:max-w-none md:w-1/2">
          <button className="btn-dark" disabled={!date || !time} onClick={next}>CONTINUER <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}

// Le calendrier ne nécessite que le produit (pas encore de date) : garde "item".
function useStepGuardItem() {
  return useStepGuard("item");
}
