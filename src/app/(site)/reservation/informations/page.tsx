"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useBooking } from "@/components/BookingProvider";
import { ErrorBox, Spinner, useStepGuard } from "@/components/Steps";
import { api, track } from "@/lib/client";

const DIALS = [
  ["🇧🇪", "+32"], ["🇫🇷", "+33"], ["🇱🇺", "+352"], ["🇳🇱", "+31"], ["🇩🇪", "+49"], ["🇨🇭", "+41"],
  ["🇬🇧", "+44"], ["🇪🇸", "+34"], ["🇮🇹", "+39"], ["🇵🇹", "+351"], ["🇨🇮", "+225"], ["🇨🇲", "+237"],
  ["🇨🇬", "+242"], ["🇨🇩", "+243"], ["🇸🇳", "+221"], ["🇲🇦", "+212"],
] as const;

export default function InformationsPage() {
  const router = useRouter();
  const { update } = useBooking();
  const { ready, sel } = useStepGuard("datetime");
  const c = sel?.customer;
  const [name, setName] = useState(c?.name ?? "");
  const [email, setEmail] = useState(c?.email ?? "");
  const [dial, setDial] = useState(c?.dial ?? "+32");
  const [phone, setPhone] = useState(c?.phone ?? "");
  const [notes, setNotes] = useState(c?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<{ message: string; back: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready || !sel) return <Spinner />;

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Veuillez indiquer votre nom complet.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Adresse email invalide.";
    if (!/^[\d\s().-]{5,}$/.test(phone.trim())) e.phone = "Numéro de téléphone invalide.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!sel || !validate()) return;
    setBusy(true);
    setServerError(null);
    const customer = { name: name.trim(), email: email.trim(), phone: `${dial} ${phone.trim()}`, notes: notes.trim() };
    const r = await api<{ token?: string; error?: string; code?: string }>("/api/booking/checkout", {
      method: "POST",
      body: JSON.stringify({
        type: sel.type,
        itemId: sel.itemId,
        variantId: sel.variantId,
        optionIds: sel.optionIds,
        date: sel.date,
        startTime: sel.time,
        customer,
        replaceToken: sel.bookingToken,
      }),
    });
    setBusy(false);
    if (!r.ok || !r.data?.token) {
      const code = r.data?.code;
      setServerError({
        message: r.data?.error ?? "Une erreur est survenue. Veuillez réessayer.",
        back: code === "SLOT_TAKEN" || code === "SERVICE_DISABLED" || code === "INVALID",
      });
      if (code === "SLOT_TAKEN") update({ time: null });
      return;
    }
    update({ customer: { name: customer.name, email: customer.email, phone: phone.trim(), dial, notes: customer.notes }, bookingToken: r.data.token });
    track("customer_info_submitted");
    router.push(`/reservation/paiement/${r.data.token}`);
  }

  return (
    <div className="container-page max-w-xl py-8 pb-12">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1 text-[12px] text-taupe"><ArrowLeft size={14} /> Retour</button>
      <h1 className="h-display text-[30px] md:text-[36px]">Vos informations</h1>
      <p className="mt-2 text-[13px] text-[#555]">Remplissez vos informations pour finaliser votre réservation.</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <div>
          <label htmlFor="name" className="field-label">Nom complet *</label>
          <input id="name" className="field" autoComplete="name" placeholder="Ex : Marie Dupont" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <p className="mt-1 text-[12.5px] text-red-700">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="field-label">Adresse email *</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" className="field" placeholder="exemple@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {errors.email && <p className="mt-1 text-[12.5px] text-red-700">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Numéro de téléphone *</label>
          <div className="flex">
            <select aria-label="Indicatif" value={dial} onChange={(e) => setDial(e.target.value)} className="field !w-[108px] shrink-0 border-r-0 !px-3">
              {DIALS.map(([flag, code]) => <option key={code} value={code}>{flag} {code}</option>)}
            </select>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" className="field" placeholder="4 612 34 56" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {errors.phone && <p className="mt-1 text-[12.5px] text-red-700">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="notes" className="field-label">Informations supplémentaires (facultatif)</label>
          <textarea id="notes" rows={4} maxLength={1000} className="field resize-none" placeholder="Ex : couleur souhaitée, remarques..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {serverError && (
          <ErrorBox>
            {serverError.message}
            {serverError.back && (
              <button type="button" onClick={() => router.push("/reservation/date")} className="mt-2 block font-medium underline">
                Choisir un autre créneau
              </button>
            )}
          </ErrorBox>
        )}

        <button className="btn-dark" disabled={busy}>
          {busy ? "VÉRIFICATION…" : <>CONTINUER <ArrowRight size={15} /></>}
        </button>
      </form>
    </div>
  );
}
