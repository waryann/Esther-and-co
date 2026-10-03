"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

/** Retour du prestataire : on attend que le WEBHOOK confirme le paiement (le retour navigateur ne suffit pas). */
export default function PaymentReturnPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<"waiting" | "failed" | "timeout">("waiting");

  useEffect(() => {
    let stop = false;
    let tries = 0;
    async function poll() {
      if (stop) return;
      const r = await api<{ status: string; paymentStatus: string | null }>(`/api/booking/${token}/status`);
      if (r.ok && (r.data.status === "CONFIRMED" || r.data.status === "COMPLETED")) {
        return void router.replace(`/paiement/instructions/${token}`);
      }
      if (r.ok && r.data.paymentStatus === "FAILED") return void setState("failed");
      if (++tries > 40) return void setState("timeout");
      setTimeout(poll, 1500);
    }
    poll();
    return () => { stop = true; };
  }, [token, router]);

  return (
    <div className="container-page max-w-md py-20 text-center">
      {state === "waiting" && (
        <>
          <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-line border-t-ink" />
          <h1 className="h-display text-[26px]">Vérification de votre paiement…</h1>
          <p className="mt-3 text-[13.5px] text-[#555]">Merci de patienter quelques secondes, ne fermez pas cette page.</p>
        </>
      )}
      {state === "failed" && (
        <>
          <h1 className="h-display text-[26px]">Paiement non abouti</h1>
          <p className="mt-3 text-[13.5px] text-[#555]">Le paiement n&apos;a pas pu être effectué. Votre créneau n&apos;a pas été confirmé.</p>
          <Link href={`/reservation/paiement/${token}`} className="btn-dark mt-6">RÉESSAYER LE PAIEMENT</Link>
        </>
      )}
      {state === "timeout" && (
        <>
          <h1 className="h-display text-[26px]">Paiement en cours de validation</h1>
          <p className="mt-3 text-[13.5px] text-[#555]">
            Nous n&apos;avons pas encore reçu la confirmation de votre paiement. Si vous avez bien été débitée, votre rendez-vous sera confirmé automatiquement et vous recevrez un email.
          </p>
          <button onClick={() => location.reload()} className="btn-dark mt-6">ACTUALISER</button>
        </>
      )}
    </div>
  );
}
