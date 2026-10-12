/** Illustration simplifiée de paquets de mèches (une ligne par paquet ; suffixe |balaye = paquet balayé). */
function Bundle({ highlighted, id }: { highlighted: boolean; id: string }) {
  const body = "M46 24 C28 62 64 84 32 124 C2 162 42 204 22 246 C12 270 32 288 62 290 C92 288 110 268 100 244 C80 202 122 160 92 122 C60 82 92 62 74 24 Z";
  return (
    <svg viewBox="0 0 124 300" className="h-[110px] w-auto min-[380px]:h-[130px]" aria-hidden>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#14100c" />
          <stop offset=".5" stopColor="#2a221b" />
          <stop offset="1" stopColor="#14100c" />
        </linearGradient>
        <clipPath id={`c-${id}`}><path d={body} /></clipPath>
      </defs>
      <rect x="38" y="6" width="48" height="20" rx="4" fill="#3b352d" />
      <rect x="38" y="12" width="48" height="3" fill="#6d655a" opacity=".6" />
      <path d={body} fill={`url(#g-${id})`} />
      <g clipPath={`url(#c-${id})`} fill="none" strokeLinecap="round">
        {highlighted && (
          <>
            <path d="M52 40 C34 80 74 104 44 146 C20 180 54 214 40 262" stroke="#9a6236" strokeWidth="9" opacity=".85" />
            <path d="M80 44 C62 84 100 106 74 146 C56 178 88 212 78 266" stroke="#b9824f" strokeWidth="7" opacity=".7" />
          </>
        )}
        <path d="M58 30 C44 70 80 92 52 130 C28 166 62 204 48 250" stroke="#ffffff" strokeWidth="2.5" opacity=".12" />
        <path d="M76 36 C62 76 96 98 70 136 C50 170 78 206 68 256" stroke="#ffffff" strokeWidth="2" opacity=".1" />
      </g>
    </svg>
  );
}

export function Bundles({ lines }: { lines: string[] }) {
  return (
    <div className="flex items-end justify-between gap-1">
      {lines.map((l, i) => {
        const [label, flag] = l.split("|");
        const m = label.match(/^(\d+["”″]?)\s*(.*)$/);
        return (
          <div key={i} className="flex flex-1 flex-col items-center text-center">
            <Bundle highlighted={flag?.trim() === "balaye"} id={String(i)} />
            <div className="mt-2 text-[9.5px] leading-tight text-[#333] min-[380px]:text-[10px]">
              {m ? (
                <>
                  <b className="font-semibold">{m[1]}</b>
                  <br />
                  {m[2]}
                </>
              ) : (
                label
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
