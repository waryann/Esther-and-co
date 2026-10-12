export const eur = (n: number) => `${n}€`;

export const eurSpaced = (n: number) => `${n} €`;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function lines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m}` : `${h} h`;
}

/** 120 → « 2 heures », 90 → « 1 h 30 », 45 → « 45 min » */
export function formatDurationLong(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h} heure${h > 1 ? "s" : ""}`;
  return `${h} h ${String(m).padStart(2, "0")}`;
}

/** Remplace {duration} dans un texte par la durée de la prestation. */
export const withDuration = (text: string, min: number) => text.replace(/\{duration\}/g, formatDurationLong(min));

/** « icone|texte » par note ; une ligne qui ne commence pas par une icône continue la note précédente (retour à la ligne). */
export function parseInfoNotes(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^(calendar|braids|shower|dryer|clock)\|/.test(line) || out.length === 0) out.push(line);
    else out[out.length - 1] += "\n" + line;
  }
  return out;
}
