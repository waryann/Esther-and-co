import { db } from "./db";

export const SETTING_DEFAULTS = {
  siteName: "ESTHAIR & CO.",
  tagline: "HAIR. BEAUTY. CONFIDENCE.",
  timezone: "Europe/Brussels",
  slotIntervalMinutes: "60",
  lockMinutes: "10",
  maxDaysAhead: "90",
  minNoticeHours: "0",
  reminderHours: "48,24",
  depositPackDefault: "50",
  depositServiceDefault: "20",
  // Coordonnées (à renseigner dans l'admin)
  address: "",
  contactEmail: "",
  phone: "",
  instagramHandle: "esthairandco",
  tiktokUrl: "",
  // Politiques (règles commerciales à fournir par ESTHAIR & CO.)
  cancellationDeadlineHours: "",
  depositRefundPolicy: "",
  reschedulePolicy: "",
  bookingPolicy: "",
  // Contenus
  heroImage: "",
  heroVideo: "/media/accueil-1.mp4,/media/accueil-2.mp4",
  reservationPacksImage: "/images/reservation-packs.webp",
  reservationServicesImage: "/images/reservation-prestations.webp",
  homeBadges:
    "Des prestations de qualité|badge\nMèches incluses dans les packs|globe\nUne expérience unique|star\n+500 clientes satisfaites|heart",
  newsletterPopupEnabled: "true",
  aboutEyebrow: "À propos de nous",
  aboutTitle: "Trois femmes, une histoire de famille, une même vision.",
  aboutIntro:
    "Derrière EST'HAIR & CO, il y a une famille réunie autour d'une ambition : rendre le luxe capillaire accessible à toutes, en offrant bien plus qu'une simple prestation, mais une véritable expérience.\n\nJe suis Esther, fondatrice et coiffeuse. À travers mon savoir-faire et ma passion, je veille à sublimer chaque cliente en lui proposant une coiffure qui correspond à ses envies, sa personnalité et ses attentes.\n\nMais EST'HAIR & CO, ce n'est pas seulement moi. C'est aussi HODAVIE, ma sœur, qui s'occupe de toute la partie administrative et de la gestion de nos logiciels, et NANA, ma maman, qui veille à la gestion financière de l'entreprise.\n\nChacune de nous joue un rôle essentiel dans cette aventure. Ensemble, nous travaillons pour que chaque cliente bénéficie d'un accompagnement soigné, d'une organisation efficace et d'une expérience à la hauteur de ses attentes.\n\nParce que derrière chaque coiffure, il y a une équipe, une famille et une attention portée à chaque détail.",
  aboutClosing: "Bienvenue chez EST'HAIR & CO, où le luxe capillaire devient accessible à toutes. 🤍",
  aboutStory: "",
  aboutPhilosophy: "",
  aboutImage: "/images/a-propos.webp",
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export type Settings = Record<SettingKey, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await db.setting.findMany();
  const out: Record<string, string> = { ...SETTING_DEFAULTS };
  for (const r of rows) if (r.key in SETTING_DEFAULTS) out[r.key] = r.value;
  return out as Settings;
}

export async function setSetting(key: SettingKey, value: string) {
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export const num = (s: string, fallback: number) => {
  const n = Number(s);
  return Number.isFinite(n) && s.trim() !== "" ? n : fallback;
};
