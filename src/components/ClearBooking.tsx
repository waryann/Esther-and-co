"use client";

import { useEffect } from "react";
import { useBooking } from "./BookingProvider";

/** Vide la sélection en cours une fois la réservation confirmée. */
export function ClearBooking() {
  const { reset, ready } = useBooking();
  useEffect(() => {
    if (ready) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
  return null;
}
