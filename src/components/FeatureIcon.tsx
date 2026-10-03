import { Clock, Layers, Leaf, Scissors, SlidersHorizontal, Sparkles, Zap } from "lucide-react";

export function FeatureIcon({ label, size = 22 }: { label: string; size?: number }) {
  const l = label.toLowerCase();
  const p = { size, strokeWidth: 1.3 };
  if (l.includes("mèche")) return <Layers {...p} />;
  if (l.includes("naturel")) return <Leaf {...p} />;
  if (l.includes("rapide")) return <Zap {...p} />;
  if (l.includes("longtemps")) return <Clock {...p} />;
  if (l.includes("personnalisation")) return <SlidersHorizontal {...p} />;
  if (l.includes("prestation") || l.includes("pose")) return <Scissors {...p} />;
  return <Sparkles {...p} />;
}

export function FeatureRow({ features }: { features: string[] }) {
  if (!features.length) return null;
  return (
    <ul className="grid grid-cols-4 gap-2 py-5 text-center">
      {features.map((f) => (
        <li key={f} className="flex flex-col items-center gap-1.5 text-[10.5px] leading-tight text-[#444]">
          <FeatureIcon label={f} />
          {f}
        </li>
      ))}
    </ul>
  );
}
