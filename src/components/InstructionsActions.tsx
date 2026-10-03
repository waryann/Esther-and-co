"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/client";

export function ScreenshotButton({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="btn-dark"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await api(`/api/booking/${token}/screenshot-sent`, { method: "POST" });
        router.push(`/confirmation/${token}`);
        router.refresh();
      }}
    >
      J&apos;AI ENVOYÉ MON PAIEMENT <ArrowRight size={15} />
    </button>
  );
}
