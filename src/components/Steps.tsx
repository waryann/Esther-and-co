"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBooking, type Selection } from "./BookingProvider";

/** Empêche de sauter une étape : redirige vers l'étape manquante. */
export function useStepGuard(need: "item" | "datetime" | "customer"): { ready: boolean; sel: Selection | null } {
  const { sel, ready } = useBooking();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!sel) return void router.replace("/reservation");
    if (need !== "item" && (!sel.date || !sel.time)) return void router.replace("/reservation/date");
    if (need === "customer" && !sel.customer) return void router.replace("/reservation/informations");
  }, [ready, sel, need, router]);
  const ok = ready && !!sel && (need === "item" || (!!sel.date && !!sel.time)) && (need !== "customer" || !!sel.customer);
  return { ready: ok, sel };
}

export function Spinner() {
  return <div className="py-16 text-center text-[13px] text-taupe">Chargement…</div>;
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
      {children}
    </div>
  );
}
