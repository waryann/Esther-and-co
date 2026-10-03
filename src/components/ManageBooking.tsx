"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ErrorBox } from "./Steps";
import { formatDateFr, MONTHS_FR, pad } from "@/lib/time";

type Alt = { date: string; times: string[] };

export function ManageBooking({ token, type, itemId, bookingId, duration }: { token: string; type: string; itemId: string; bookingId: string; duration: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reschedule">("idle");
  const [month, setMonth] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });
  const [days, setDays] = useState<string[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [alts, setAlts] = useState<Alt[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (mode !== "reschedule") return;
    api<{ days: string[] }>(`/api/availability?type=${type}&itemId=${itemId}&month=${month.y}-${pad(month.m + 1)}&exclude=${bookingId}`).then((r) => setDays(r.data?.days ?? []));
  }, [mode, month, type, itemId, bookingId]);

  useEffect(() => {
    if (!date) return;
    api<{ slots: string[] }>(`/api/availability/slots?type=${type}&itemId=${itemId}&date=${date}`).then((r) => setSlots(r.data?.slots ?? []));
  }, [date, type, itemId]);

  async function move(d: string, t: string) {
    setBusy(true);
    setError("");
    const r = await api<{ error?: string; alternatives?: Alt[] }>(`/api/booking/${token}/reschedule`, { method: "POST", body: JSON.stringify({ date: d, startTime: t }) });
    setBusy(false);
    if (r.ok) return void router.refresh();
    setError(r.data?.error ?? "Erreur.");
    setAlts(r.data?.alternatives ?? []);
  }

  async function cancel() {
    if (!confirm("Confirmer l'annulation de votre rendez-vous ?")) return;
    setBusy(true);
    const r = await api<{ error?: string }>(`/api/booking/${token}/cancel`, { method: "POST" });
    setBusy(false);
    if (r.ok) router.refresh();
    else setError(r.data?.error ?? "Erreur.");
  }

  return (
    <div className="mt-6 space-y-3">
      {error && <ErrorBox>{error}</ErrorBox>}
      {alts.length > 0 && (
        <div className="card p-4 text-[13px]">
          <p className="mb-2 font-medium">Autres créneaux disponibles :</p>
          {alts.map((a) => (
            <div key={a.date} className="mb-2">
              <div className="text-[12px] text-taupe">{formatDateFr(a.date)}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {a.times.map((t) => <button key={t} onClick={() => move(a.date, t)} className="border border-line px-3 py-1.5 hover:border-ink">{t}</button>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {mode === "idle" ? (
        <>
          <button className="btn-dark" onClick={() => setMode("reschedule")}>MODIFIER MON RENDEZ-VOUS</button>
          <button className="btn-outline" disabled={busy} onClick={cancel}>ANNULER MON RENDEZ-VOUS</button>
        </>
      ) : (
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setMonth((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))} className="px-2">‹</button>
            <span className="font-serif text-[17px] capitalize">{MONTHS_FR[month.m]} {month.y}</span>
            <button onClick={() => setMonth((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))} className="px-2">›</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {days.length === 0 && <p className="text-[13px] text-[#777]">Aucune disponibilité ce mois-ci.</p>}
            {days.map((d) => (
              <button key={d} onClick={() => setDate(d)} className={`border px-3 py-1.5 text-[13px] ${date === d ? "border-ink bg-ink text-white" : "border-line"}`}>
                {Number(d.slice(8))}
              </button>
            ))}
          </div>
          {date && (
            <div className="mt-4">
              <div className="mb-2 text-[12px] text-taupe">{formatDateFr(date)}</div>
              <div className="flex flex-wrap gap-2">
                {slots.map((t) => <button key={t} disabled={busy} onClick={() => move(date, t)} className="border border-line px-3 py-1.5 text-[13px] hover:border-ink">{t}</button>)}
              </div>
            </div>
          )}
          <button onClick={() => setMode("idle")} className="mt-4 text-[12px] text-taupe underline">Annuler</button>
        </div>
      )}
      <p className="hidden">{duration}</p>
    </div>
  );
}
