"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CreditCard, Lock } from "lucide-react";
import { ErrorBox, Spinner } from "@/components/Steps";
import { useBooking } from "@/components/BookingProvider";
import { api } from "@/lib/client";
import { eur } from "@/lib/format";
import { formatDateFr } from "@/lib/time";

type Summary = {
  reference: string; type: string; itemName: string; variantLabel: string;
  options: { name: string; price: number }[]; date: string; startTime: string;
  totalAmount: number; depositAmount: number; remainingAmount: number;
  status: string; lockSecondsLeft: number;
};

type Changed = { total: number; deposit: number; remaining: number };

function PaymentInner() {
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const { sel, update } = useBooking();
  const [b, setB] = useState<Summary | null>(null);
  const [missing, setMissing] = useState(false);
  const [left, setLeft] = useState(0);
  const [method, setMethod] = useState<"card" | "applepay" | "paypal">("card");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(search.get("echec") ? "Le paiement n'a pas pu être effectué. Votre créneau n'a pas été confirmé." : "");
  const [changed, setChanged] = useState<Changed | null>(null);

  useEffect(() => {
    api<{ booking: Summary }>(`/api/booking/${token}`).then((r) => {
      if (!r.ok) return void setMissing(true);
      setB(r.data.booking);
      setLeft(r.data.booking.lockSecondsLeft);
    });
  }, [token]);

  useEffect(() => {
    if (!b || b.status !== "PENDING_PAYMENT") return;
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [b]);

  useEffect(() => {
    if (b && (b.status === "CONFIRMED" || b.status === "COMPLETED")) router.replace(`/paiement/instructions/${token}`);
  }, [b, token, router]);

  if (missing) return <div className="container-page max-w-xl py-10"><ErrorBox>Rendez-vous introuvable.</ErrorBox></div>;
  if (!b) return <Spinner />;

  if (b.status === "CONFIRMED" || b.status === "COMPLETED") return <Spinner />;

  const expired = b.status !== "PENDING_PAYMENT" || left <= 0;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  async function pay(confirmChange = false) {
    setBusy(true);
    setError("");
    const r = await api<{ redirectUrl?: string; error?: string; code?: string; quote?: { total: number; deposit: number; remaining: number } }>(
      `/api/booking/${token}/pay`,
      { method: "POST", body: JSON.stringify({ method, confirmChange }) },
    );
    if (r.ok && r.data.redirectUrl) {
      window.location.href = r.data.redirectUrl;
      return;
    }
    setBusy(false);
    if (r.data?.code === "PRICE_CHANGED" && r.data.quote) {
      setChanged({ total: r.data.quote.total, deposit: r.data.quote.deposit, remaining: r.data.quote.remaining });
      return;
    }
    if (r.data?.code === "SESSION_EXPIRED") setB({ ...b!, status: "EXPIRED" });
    setError(r.data?.error ?? "Une erreur est survenue. Veuillez réessayer.");
  }

  function restart() {
    update({ time: null, bookingToken: null });
    router.push("/reservation/date");
  }

  const isPack = b.type === "PACKAGE";

  return (
    <div className="container-page max-w-xl py-8 pb-12">
      <button onClick={() => router.push(sel ? "/reservation/informations" : "/reservation")} className="mb-4 inline-flex items-center gap-1 text-[12px] text-taupe"><ArrowLeft size={14} /> Retour</button>
      <h1 className="h-display text-[30px] md:text-[36px]">Paiement de l&apos;acompte</h1>

      {expired ? (
        <div className="mt-6 space-y-4">
          <ErrorBox>Votre session de réservation a expiré. Veuillez sélectionner à nouveau votre créneau.</ErrorBox>
          <button onClick={restart} className="btn-dark">CHOISIR UN CRÉNEAU</button>
        </div>
      ) : (
        <>
          {error && <div className="mt-5"><ErrorBox>{error}</ErrorBox></div>}

          {changed && (
            <div className="mt-5 border border-tan bg-beige/50 p-4 text-[13.5px]">
              <p className="font-medium">Le récapitulatif a changé.</p>
              <p className="mt-1">Nouveau total : <b>{eur(changed.total)}</b> · acompte : <b>{eur(changed.deposit)}</b> · solde : <b>{eur(changed.remaining)}</b>.</p>
              <button onClick={() => pay(true)} disabled={busy} className="btn-dark mt-3">CONFIRMER ET PAYER</button>
            </div>
          )}

          <dl className="card mt-6 divide-y divide-line text-[14px]">
            <Row k="Service" v={b.itemName} />
            {b.variantLabel && <Row k="Variante" v={b.variantLabel} />}
            {b.options.length > 0 && <Row k="Option" v={b.options.map((o) => `${o.name} (+${eur(o.price)})`).join(", ")} />}
            <Row k="Date" v={formatDateFr(b.date)} />
            <Row k="Heure" v={b.startTime} />
            <Row k="Total" v={eur(b.totalAmount)} strong />
            <Row k="Acompte à payer" v={eur(b.depositAmount)} strong />
            <Row k="Solde (à régler sur place)" v={eur(b.remainingAmount)} />
          </dl>

          <div className="mt-5 bg-sand p-5">
            <div className="flex items-center gap-2.5 text-[14px] font-medium">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white"><CreditCard size={14} /></span>
              Montant de l&apos;acompte
            </div>
            <ul className="mt-3 list-disc pl-10 text-[13.5px]">
              {isPack ? <li>Packs : {eur(b.depositAmount)}</li> : <li>Prestations : {eur(b.depositAmount)}</li>}
            </ul>
            <p className="mt-3 text-[12px] leading-relaxed text-[#555]">
              L&apos;acompte permet de confirmer votre rendez-vous. Le solde sera à régler sur place le jour de la prestation.
            </p>
          </div>

          <p className="mt-4 text-center text-[12px] text-taupe">
            Créneau réservé pour vous pendant <b className="tabular-nums">{mm}:{ss}</b>
          </p>

          <fieldset className="card mt-4 divide-y divide-line">
            <legend className="sr-only">Moyen de paiement</legend>
            {(
              [
                ["card", "Carte bancaire", "VISA  MC  AMEX"],
                ["applepay", "Apple Pay", " Pay"],
                ["paypal", "PayPal", "PayPal"],
              ] as const
            ).map(([k, label, badge]) => (
              <label key={k} className="flex cursor-pointer items-center justify-between px-4 py-4 text-[14px]">
                <span className="flex items-center gap-3">
                  <input type="radio" name="method" className="accent-ink" checked={method === k} onChange={() => setMethod(k)} />
                  {label}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-[#1a3fa5]">{badge}</span>
              </label>
            ))}
          </fieldset>

          <button onClick={() => pay(false)} disabled={busy || !!changed} className="btn-dark mt-5">
            {busy ? "REDIRECTION…" : <>PAYER L&apos;ACOMPTE <ArrowRight size={15} /></>}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11.5px] text-taupe"><Lock size={12} /> Paiement sécurisé</p>
        </>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <dt className="text-[12px] uppercase tracking-[0.1em] text-taupe">{k}</dt>
      <dd className={`text-right ${strong ? "font-medium" : ""}`}>{v}</dd>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PaymentInner />
    </Suspense>
  );
}
