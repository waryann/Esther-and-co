import { Clock, CircleCheck, Gem, Layers, Leaf, Paintbrush, Scissors, SlidersHorizontal, Sparkles, UserRound, Zap } from "lucide-react";
import { Rich } from "./Rich";

export function FeatureIcon({ label, size = 22 }: { label: string; size?: number }) {
  const l = label.toLowerCase().replace(/\*\*/g, "");
  const p = { size, strokeWidth: 1.3 };
  if (l.includes("raw hair")) return <Gem {...p} />;
  if (l.includes("balay")) return <Paintbrush {...p} />;
  if (l.includes("résultat")) return <CircleCheck {...p} />;
  if (l.includes("tissage")) return <UserRound {...p} />;
  if (l.includes("mèche") || l.includes("bundle")) return <Layers {...p} />;
  if (l.includes("naturel")) return <Leaf {...p} />;
  if (l.includes("rapide")) return <Zap {...p} />;
  if (l.includes("longtemps") || l.includes("durabilit")) return <Clock {...p} />;
  if (l.includes("personnalisation")) return <SlidersHorizontal {...p} />;
  if (l.includes("prestation") || l.includes("pose")) return <Scissors {...p} />;
  return <Sparkles {...p} />;
}

/** Sépare « Durabilité **2 heures** » en libellé + valeur en gras sur la ligne suivante, comme sur les maquettes. */
function Label({ text }: { text: string }) {
  return <Rich text={text} />;
}

export function FeatureRow({ features, circles = false }: { features: string[]; circles?: boolean }) {
  if (!features.length) return null;
  return (
    <ul className={`grid grid-cols-4 gap-2 py-5 text-center ${circles ? "gap-x-1" : ""}`}>
      {features.map((f) => {
        const [head, bold] = f.includes("**") ? [f.replace(/\s*\*\*[^*]+\*\*/, ""), f.match(/\*\*([^*]+)\*\*/)?.[1]] : [f, undefined];
        return (
          <li key={f} className={`flex min-w-0 flex-col items-center gap-2 leading-tight text-[#444] ${circles ? "text-[10.5px] sm:text-[11.5px]" : "gap-1.5 text-[10.5px]"}`}>
            {circles ? (
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-sand text-ink">
                <FeatureIcon label={f} size={22} />
              </span>
            ) : (
              <FeatureIcon label={f} />
            )}
            <span className="[overflow-wrap:anywhere]">
              {head}
              {bold && (
                <>
                  <br />
                  <b className="font-semibold text-ink">{bold}</b>
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Pastilles façon « pack Balayage » : cercles, libellés en capitales espacées. */
export function HighlightGrid({ items }: { items: string[] }) {
  return (
    <ul className="grid min-w-0 grid-cols-3 gap-x-1 gap-y-4 text-center">
      {items.map((f) => (
        <li key={f} className="flex min-w-0 flex-col items-center gap-2">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sand text-ink sm:h-[58px] sm:w-[58px]">
            <FeatureIcon label={f} size={20} />
          </span>
          <span className="min-w-0 text-[7.5px] font-light uppercase leading-snug tracking-[0.05em] text-[#444] [overflow-wrap:anywhere] sm:text-[9.5px] sm:tracking-[0.1em]">
            <Label text={f} />
          </span>
        </li>
      ))}
    </ul>
  );
}
