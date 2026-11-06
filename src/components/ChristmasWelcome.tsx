"use client";

import { useEffect, useState } from "react";

const KEY = "esthair_xmas_seen";
const FLAKES = 46;
const DURATION = 7000;

type Flake = { left: number; size: number; delay: number; fall: number; drift: number; glyph: boolean; gold: boolean };

/** Petite neige de bienvenue (une fois par session), qui s'efface d'elle-même au bout de quelques secondes. */
export function ChristmasWelcome() {
  const [flakes, setFlakes] = useState<Flake[] | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
    } catch {}
    setFlakes(
      Array.from({ length: FLAKES }, () => ({
        left: Math.random() * 100,
        size: 6 + Math.random() * 12,
        delay: Math.random() * 2.6,
        fall: 4 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 120,
        glyph: Math.random() < 0.35,
        gold: Math.random() < 0.25,
      })),
    );
  }, []);

  const active = flakes !== null;
  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => setLeaving(true), DURATION - 900);
    const t2 = setTimeout(() => setFlakes(null), DURATION);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active]);

  if (!flakes) return null;

  return (
    <div aria-hidden className={`pointer-events-none fixed inset-0 z-40 overflow-hidden transition-opacity duration-700 ${leaving ? "opacity-0" : "opacity-100"}`}>
      {flakes.map((f, i) => (
        <span
          key={i}
          className="xmas-flake absolute top-0 select-none leading-none"
          style={{
            left: `${f.left}%`,
            fontSize: f.size,
            width: f.glyph ? undefined : f.size * 0.55,
            height: f.glyph ? undefined : f.size * 0.55,
            animationDuration: `${f.fall}s`,
            animationDelay: `${f.delay}s`,
            color: f.gold ? "#D8BC9A" : "#fff",
            "--drift": `${f.drift}px`,
          } as React.CSSProperties}
        >
          {f.glyph ? "❄" : <i className="block h-full w-full rounded-full bg-current" />}
        </span>
      ))}
      <div className="absolute inset-x-0 top-[22%] flex justify-center px-4">
        <div className="animate-xmas-hello rounded-full border border-white/40 bg-ink/55 px-6 py-2.5 text-center font-serif text-[18px] tracking-[0.12em] text-white shadow-lg backdrop-blur-sm md:text-[22px]">
          Joyeuses fêtes <span className="text-tan">✦</span>
        </div>
      </div>
    </div>
  );
}
