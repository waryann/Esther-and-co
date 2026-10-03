"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ErrorBox } from "./Steps";

export function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [hasPhoto, setHasPhoto] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "ok">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("busy");
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("rating", String(rating));
    const res = await fetch("/api/reviews", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return void setState("ok");
    setError(data.error ?? "Une erreur est survenue.");
    setState("idle");
  }

  if (state === "ok") return <p className="bg-sand p-5 text-center text-[14px]">Merci ! Votre avis sera publié après validation. 🤍</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="field-label" htmlFor="firstName">Prénom *</label>
        <input id="firstName" name="firstName" required minLength={2} maxLength={60} className="field" />
      </div>
      <div>
        <span className="field-label">Note *</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} étoiles`} className="text-[#c8863b]">
              <Star size={26} fill={n <= rating ? "currentColor" : "none"} strokeWidth={1.3} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="comment">Votre avis *</label>
        <textarea id="comment" name="comment" required minLength={10} maxLength={1000} rows={4} className="field resize-none" />
      </div>
      <div>
        <label className="field-label" htmlFor="photo">Photo (facultatif — JPG, PNG, WEBP, 6 Mo max)</label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setHasPhoto(!!e.target.files?.length)} className="block w-full text-[13px]" />
      </div>
      {hasPhoto && (
        <label className="flex items-start gap-3 text-[13px] leading-snug">
          <input type="checkbox" name="consent" required className="mt-0.5 accent-ink" />
          J&apos;autorise ESTHAIR &amp; CO. à utiliser cette photo sur son site et ses réseaux.
        </label>
      )}
      {error && <ErrorBox>{error}</ErrorBox>}
      <button className="btn-dark" disabled={state === "busy"}>{state === "busy" ? "ENVOI…" : "ENVOYER MON AVIS"}</button>
    </form>
  );
}
