export function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.6 2.1 4.2 5 4.4" />
    </svg>
  );
}

export function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" />
    </svg>
  );
}

/** Petit bonnet de Noël posé de travers sur le « & » du logo. */
export function SantaHat({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 34" className={className} aria-hidden>
      <path d="M6 25C7 15 13 6 24 4c6-1 11 2 13 8-4-2-8-1-9 2 1 4 3 8 5 11Z" fill="#C1272D" />
      <path d="M28 14c1 4 3 8 5 11h-6c-1-4-1-8 1-11Z" fill="#8F1D22" />
      <path d="M12 23c1-6 4-11 9-14" stroke="#E0535A" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".7" />
      <rect x="3" y="22.5" width="33" height="8.5" rx="4.25" fill="#FFFDF8" />
      <path d="M6 28.5h27" stroke="#E5D5BF" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="37" cy="13" r="3.8" fill="#FFFDF8" />
      <circle cx="36" cy="12" r="1.3" fill="#fff" />
    </svg>
  );
}

/** Le « & » du logo ESTHAIR & CO., coiffé du bonnet de Noël. */
export function BrandAmp({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      &amp;
      <SantaHat className="pointer-events-none absolute left-1/2 top-[-0.44em] w-[0.95em] origin-bottom -translate-x-[42%] -rotate-12 animate-sway drop-shadow-[0_1px_1px_rgba(0,0,0,.25)] motion-reduce:animate-none" />
    </span>
  );
}
