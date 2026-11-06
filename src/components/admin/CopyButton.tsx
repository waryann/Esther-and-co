"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copier le lien" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {}
      }}
      className="border border-line bg-white px-4 py-2.5 text-[12px] font-medium uppercase tracking-[0.12em] hover:border-ink"
    >
      {done ? "Copié ✓" : label}
    </button>
  );
}
