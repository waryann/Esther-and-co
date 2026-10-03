"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Customer = { name: string; email: string; phone: string; dial: string; notes: string };

export type Selection = {
  type: "PACKAGE" | "SERVICE";
  itemId: string;
  itemSlug: string;
  itemName: string;
  variantId: string | null;
  variantLabel: string;
  optionIds: string[];
  date: string | null;
  time: string | null;
  customer: Customer | null;
  bookingToken: string | null; // réservation PENDING_PAYMENT en cours (verrou actif)
};

type Ctx = {
  sel: Selection | null;
  ready: boolean;
  start: (s: Pick<Selection, "type" | "itemId" | "itemSlug" | "itemName" | "variantId" | "variantLabel"> & { optionIds?: string[] }) => void;
  update: (patch: Partial<Selection>) => void;
  reset: () => void;
};

const KEY = "esthair_booking";
const BookingCtx = createContext<Ctx | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [sel, setSel] = useState<Selection | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setSel(JSON.parse(raw));
    } catch {
      /* stockage indisponible */
    }
    setReady(true);
  }, []);

  const persist = useCallback((s: Selection | null) => {
    setSel(s);
    try {
      if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
      else sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      sel,
      ready,
      start: (s) =>
        persist({ ...s, optionIds: s.optionIds ?? [], date: null, time: null, customer: sel?.customer ?? null, bookingToken: null }),
      update: (patch) => sel && persist({ ...sel, ...patch }),
      reset: () => persist(null),
    }),
    [sel, ready, persist],
  );

  return <BookingCtx.Provider value={value}>{children}</BookingCtx.Provider>;
}

export function useBooking() {
  const c = useContext(BookingCtx);
  if (!c) throw new Error("BookingProvider manquant");
  return c;
}
