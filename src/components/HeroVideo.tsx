"use client";

import { useEffect, useRef } from "react";

/** Vidéos en split : toutes tournent en même temps, côte à côte, en boucle (muettes). */
export function HeroVideo({ sources, poster }: { sources: string[]; poster?: string }) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const play = () => refs.current.forEach((v) => v?.paused && v.play().catch(() => {}));
    refs.current.forEach((v) => {
      if (v) {
        v.muted = true; // iOS exige l'attribut muted réel pour autoriser l'autoplay
        v.setAttribute("webkit-playsinline", "");
      }
    });
    play();
    // Mode économie d'énergie (iOS) : l'autoplay est bloqué jusqu'au premier geste → on relance dès qu'il y en a un.
    const events = ["touchstart", "pointerdown", "scroll", "click", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, play, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, play));
  }, [sources.length]);

  if (!sources.length) return null;
  return (
    <div className="absolute inset-0 grid gap-px bg-black" style={{ gridTemplateColumns: `repeat(${sources.length}, minmax(0, 1fr))` }}>
      {sources.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            refs.current[i] = el;
          }}
          src={src}
          poster={i === 0 ? poster : undefined}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          disablePictureInPicture
          controls={false}
          aria-hidden
          className="h-full w-full object-cover"
        />
      ))}
    </div>
  );
}
