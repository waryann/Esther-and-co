"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { api, track } from "@/lib/client";

type Variant = "bar" | "stack";

export function NewsletterForm({ variant = "bar", onDone }: { variant?: Variant; onDone?: () => void }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    const r = await api<{ message?: string; error?: string }>("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (r.ok) {
      setState("ok");
      setMsg(r.data?.message ?? "Merci ! Vous êtes maintenant inscrite à notre newsletter.");
      track("newsletter_signup");
      try { localStorage.setItem("esthair_newsletter", "1"); } catch {}
      onDone?.();
    } else {
      setState("error");
      setMsg(r.data?.error ?? "Une erreur est survenue. Veuillez réessayer.");
    }
  }

  if (state === "ok") return <p className="py-3 text-[14px] text-taupe" role="status">{msg}</p>;

  return (
    <form onSubmit={submit} noValidate>
      {variant === "bar" ? (
        <div className="flex">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            aria-label="Votre adresse email"
            className="field min-w-0 flex-1 !py-3 text-[14px]"
          />
          <button
            type="submit"
            disabled={state === "loading"}
            aria-label="S'inscrire"
            className="flex w-14 shrink-0 items-center justify-center bg-ink text-white md:w-auto md:px-8 md:text-[12.5px] md:font-medium md:uppercase md:tracking-[0.16em]"
          >
            <ArrowRight size={18} className="md:hidden" />
            <span className="hidden md:inline">S&apos;INSCRIRE</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            aria-label="Votre adresse email"
            className="field"
          />
          <button type="submit" disabled={state === "loading"} className="btn-dark">
            S&apos;INSCRIRE
          </button>
        </div>
      )}
      {state === "error" && <p className="mt-2 text-[13px] text-red-700" role="alert">{msg}</p>}
    </form>
  );
}
