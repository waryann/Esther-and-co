import { db } from "./db";

export type QuoteInput = {
  type: "PACKAGE" | "SERVICE";
  itemId: string;
  variantId?: string | null;
  optionIds?: string[];
};

export type QuoteError =
  | "ITEM_NOT_FOUND"
  | "ITEM_INACTIVE"
  | "VARIANT_REQUIRED"
  | "VARIANT_INVALID"
  | "OPTION_INVALID";

export type Quote =
  | {
      ok: true;
      type: "PACKAGE" | "SERVICE";
      itemId: string;
      itemName: string;
      itemSlug: string;
      variantId: string | null;
      variantLabel: string;
      options: { id: string; name: string; price: number }[];
      basePrice: number;
      total: number;
      deposit: number;
      remaining: number;
      durationMinutes: number;
    }
  | { ok: false; error: QuoteError };

/**
 * Calcul serveur du prix. Le frontend n'envoie que des identifiants :
 * total = prix de base (variante ou pack/prestation) + options actives.
 */
export async function computeQuote(input: QuoteInput): Promise<Quote> {
  const optionIds = Array.from(new Set(input.optionIds ?? []));
  let itemName = "";
  let itemSlug = "";
  let basePrice = 0;
  let deposit = 0;
  let duration = 0;
  let variantId: string | null = null;
  let variantLabel = "";
  let scope: "PACKAGE" | "SERVICE" = input.type;

  if (input.type === "PACKAGE") {
    const pkg = await db.package.findUnique({
      where: { id: input.itemId },
      include: { variants: { where: { active: true } } },
    });
    if (!pkg) return { ok: false, error: "ITEM_NOT_FOUND" };
    if (!pkg.active) return { ok: false, error: "ITEM_INACTIVE" };
    itemName = pkg.name;
    itemSlug = pkg.slug;
    deposit = pkg.depositAmount;
    duration = pkg.durationMinutes;
    basePrice = pkg.basePrice;
    if (pkg.variants.length) {
      if (!input.variantId) return { ok: false, error: "VARIANT_REQUIRED" };
      const v = pkg.variants.find((x) => x.id === input.variantId);
      if (!v) return { ok: false, error: "VARIANT_INVALID" };
      basePrice = v.price;
      variantId = v.id;
      variantLabel = v.label;
    } else if (input.variantId) {
      return { ok: false, error: "VARIANT_INVALID" };
    }
  } else {
    const svc = await db.service.findUnique({ where: { id: input.itemId } });
    if (!svc) return { ok: false, error: "ITEM_NOT_FOUND" };
    if (!svc.active) return { ok: false, error: "ITEM_INACTIVE" };
    itemName = svc.name;
    itemSlug = svc.slug;
    basePrice = svc.price;
    deposit = svc.depositAmount;
    duration = svc.durationMinutes;
    scope = "SERVICE";
  }

  const options = optionIds.length
    ? await db.serviceOption.findMany({
        where: { id: { in: optionIds }, active: true, scope: { in: [scope, "BOTH"] } },
      })
    : [];
  if (options.length !== optionIds.length) return { ok: false, error: "OPTION_INVALID" };

  const total = basePrice + options.reduce((s, o) => s + o.priceModifier, 0);
  const dep = Math.min(deposit, total);
  return {
    ok: true,
    type: input.type,
    itemId: input.itemId,
    itemName,
    itemSlug,
    variantId,
    variantLabel,
    options: options.map((o) => ({ id: o.id, name: o.name, price: o.priceModifier })),
    basePrice,
    total,
    deposit: dep,
    remaining: total - dep,
    durationMinutes: duration,
  };
}

export const QUOTE_ERROR_MESSAGES: Record<QuoteError, string> = {
  ITEM_NOT_FOUND: "Ce service est introuvable.",
  ITEM_INACTIVE: "Ce service n'est actuellement plus disponible à la réservation.",
  VARIANT_REQUIRED: "Veuillez choisir votre longueur.",
  VARIANT_INVALID: "Cette variante n'est plus disponible. Veuillez en choisir une autre.",
  OPTION_INVALID: "Une des options choisies n'est plus disponible.",
};

/** Durée d'un produit (sert à calculer les créneaux avant même le choix des options). */
export async function getDuration(type: "PACKAGE" | "SERVICE", itemId: string): Promise<number | null> {
  if (type === "PACKAGE") {
    const p = await db.package.findUnique({ where: { id: itemId }, select: { durationMinutes: true, active: true } });
    return p?.active ? p.durationMinutes : null;
  }
  const s = await db.service.findUnique({ where: { id: itemId }, select: { durationMinutes: true, active: true } });
  return s?.active ? s.durationMinutes : null;
}
