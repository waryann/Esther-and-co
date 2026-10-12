import { CalendarDays, Clock, ShowerHead, UserRound, Wind } from "lucide-react";
import { Rich } from "./Rich";

const ICONS: Record<string, React.ReactNode> = {
  calendar: <CalendarDays size={30} strokeWidth={1.2} />,
  braids: <UserRound size={30} strokeWidth={1.2} />,
  shower: <ShowerHead size={30} strokeWidth={1.2} />,
  dryer: <Wind size={30} strokeWidth={1.2} />,
  clock: <Clock size={30} strokeWidth={1.2} />,
};

/** Bloc « Informations importantes » : une note par ligne au format `icone|texte` (**gras** possible). */
export function InfoNotes({ notes }: { notes: string[] }) {
  if (!notes.length) return null;
  return (
    <section className="mt-5 rounded-2xl border border-line bg-[#f6efe5] px-5 py-5">
      <h2 className="font-serif text-[13px] font-semibold uppercase tracking-[0.2em]">Informations importantes</h2>
      <ul className="mt-4 space-y-5">
        {notes.map((n, i) => {
          const [icon, ...rest] = n.split("|");
          const text = rest.join("|");
          return (
            <li key={i} className="flex items-center gap-4 text-[13.5px] leading-snug text-[#333]">
              <span className="w-9 shrink-0 text-ink">{ICONS[icon.trim()] ?? ICONS.clock}</span>
              <span className="whitespace-pre-line"><Rich text={text} /></span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
