"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { bool, file, int, str } from "@/lib/form";
import { slugify } from "@/lib/format";
import { saveImage, UploadError } from "@/lib/upload";
import { SETTING_DEFAULTS, setSetting, type SettingKey } from "@/lib/settings";
import { isDateStr, toMin } from "@/lib/time";
import { isIntervalFree } from "@/lib/availability";
import { BookingError, cancelBooking, createAdminBooking, rescheduleBooking } from "@/lib/booking";

const go = (path: string, msg?: string, error?: string): never => {
  const q = new URLSearchParams();
  if (msg) q.set("msg", msg);
  if (error) q.set("error", error);
  redirect(q.size ? `${path}${path.includes("?") ? "&" : "?"}${q}` : path);
};

/** Exécute une action en convertissant les erreurs métier en message d'erreur affiché. */
async function safe(path: string, fn: () => Promise<string | void>): Promise<never> {
  await requireAdmin();
  let msg: string | void;
  try {
    msg = await fn();
  } catch (e) {
    if (isRedirectError(e)) throw e;
    if (e instanceof BookingError || e instanceof UploadError) return go(path, undefined, e.message);
    console.error(e);
    return go(path, undefined, "Une erreur est survenue : vérifiez les champs saisis.");
  }
  return go(path, msg || "Enregistré.");
}

async function uniqueSlug(model: "package" | "service" | "blogPost", base: string, ignoreId?: string) {
  let slug = slugify(base) || "element";
  let n = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = await (db[model] as any).findUnique({ where: { slug } });
    if (!found || found.id === ignoreId) return slug;
    slug = `${slugify(base)}-${n++}`;
  }
}

// ───────────────────────── Packs ─────────────────────────
export async function savePackage(fd: FormData) {
  const id = str(fd, "id");
  const path = id ? `/admin/packs/${id}` : "/admin/packs";
  return safe(path, async () => {
    const name = str(fd, "name");
    if (!name) throw new BookingError("INVALID", "Le nom est obligatoire.");
    const img = file(fd, "image");
    const data = {
      name,
      shortDescription: str(fd, "shortDescription"),
      description: str(fd, "description"),
      basePrice: int(fd, "basePrice"),
      depositAmount: int(fd, "depositAmount", 50),
      durationMinutes: int(fd, "durationMinutes", 180),
      features: str(fd, "features"),
      active: bool(fd, "active"),
      sortOrder: int(fd, "sortOrder"),
      seoTitle: str(fd, "seoTitle"),
      seoDescription: str(fd, "seoDescription"),
      ...(img ? { image: await saveImage(img) } : {}),
    };
    if (id) {
      await db.package.update({ where: { id }, data: { ...data, slug: await uniqueSlug("package", str(fd, "slug") || name, id) } });
    } else {
      const created = await db.package.create({ data: { ...data, slug: await uniqueSlug("package", str(fd, "slug") || name) } });
      revalidatePath("/admin/packs");
      return go(`/admin/packs/${created.id}`, "Pack créé. Ajoutez maintenant ses variantes.");
    }
    revalidatePath("/", "layout");
    return "Pack enregistré.";
  });
}

export async function saveVariant(fd: FormData) {
  const packageId = str(fd, "packageId");
  return safe(`/admin/packs/${packageId}`, async () => {
    const id = str(fd, "id");
    const label = str(fd, "label");
    if (!label) throw new BookingError("INVALID", "Le libellé de la variante est obligatoire.");
    const data = {
      label,
      bundles: int(fd, "bundles"),
      length: int(fd, "length"),
      price: int(fd, "price"),
      sortOrder: int(fd, "sortOrder"),
      active: bool(fd, "active"),
    };
    if (id) await db.packageVariant.update({ where: { id }, data });
    else await db.packageVariant.create({ data: { ...data, packageId, active: true } });
    revalidatePath("/", "layout");
    return id ? "Variante enregistrée." : "Variante ajoutée.";
  });
}

export async function deleteVariant(fd: FormData) {
  const packageId = str(fd, "packageId");
  return safe(`/admin/packs/${packageId}`, async () => {
    await db.packageVariant.delete({ where: { id: str(fd, "id") } });
    revalidatePath("/", "layout");
    return "Variante supprimée.";
  });
}

// ───────────────────────── Prestations ─────────────────────────
export async function saveService(fd: FormData) {
  const id = str(fd, "id");
  const path = id ? `/admin/prestations/${id}` : "/admin/prestations";
  return safe(path, async () => {
    const name = str(fd, "name");
    if (!name) throw new BookingError("INVALID", "Le nom est obligatoire.");
    const img = file(fd, "image");
    const data = {
      name,
      shortDescription: str(fd, "shortDescription"),
      description: str(fd, "description"),
      price: int(fd, "price"),
      priceFrom: bool(fd, "priceFrom"),
      depositAmount: int(fd, "depositAmount", 20),
      durationMinutes: int(fd, "durationMinutes", 120),
      features: str(fd, "features"),
      active: bool(fd, "active"),
      sortOrder: int(fd, "sortOrder"),
      seoTitle: str(fd, "seoTitle"),
      seoDescription: str(fd, "seoDescription"),
      ...(img ? { image: await saveImage(img) } : {}),
    };
    if (id) {
      await db.service.update({ where: { id }, data: { ...data, slug: await uniqueSlug("service", str(fd, "slug") || name, id) } });
    } else {
      const created = await db.service.create({ data: { ...data, slug: await uniqueSlug("service", str(fd, "slug") || name) } });
      revalidatePath("/admin/prestations");
      return go(`/admin/prestations/${created.id}`, "Prestation créée.");
    }
    revalidatePath("/", "layout");
    return "Prestation enregistrée.";
  });
}

// ───────────────────────── Options ─────────────────────────
export async function saveOption(fd: FormData) {
  return safe("/admin/options", async () => {
    const id = str(fd, "id");
    const name = str(fd, "name");
    if (!name) throw new BookingError("INVALID", "Le nom est obligatoire.");
    const img = file(fd, "image");
    const data = {
      name,
      description: str(fd, "description"),
      priceModifier: int(fd, "priceModifier"),
      scope: ["PACKAGE", "SERVICE", "BOTH"].includes(str(fd, "scope")) ? str(fd, "scope") : "PACKAGE",
      sortOrder: int(fd, "sortOrder"),
      active: id ? bool(fd, "active") : true,
      ...(img ? { image: await saveImage(img, 400) } : {}),
    };
    if (id) await db.serviceOption.update({ where: { id }, data });
    else await db.serviceOption.create({ data });
    revalidatePath("/", "layout");
    return id ? "Option enregistrée — les prix se recalculent automatiquement." : "Option ajoutée.";
  });
}

export async function deleteOption(fd: FormData) {
  return safe("/admin/options", async () => {
    await db.serviceOption.delete({ where: { id: str(fd, "id") } });
    return "Option supprimée.";
  });
}

// ───────────────────────── Rendez-vous ─────────────────────────
export async function createBookingAction(fd: FormData) {
  return safe("/admin/rendez-vous/nouveau", async () => {
    const [type, itemId] = str(fd, "item").split(":");
    if ((type !== "PACKAGE" && type !== "SERVICE") || !itemId) throw new BookingError("INVALID", "Choisissez un pack ou une prestation.");
    const date = str(fd, "date");
    const startTime = str(fd, "startTime");
    if (!isDateStr(date) || !/^\d{2}:\d{2}$/.test(startTime)) throw new BookingError("INVALID", "Date ou heure invalide.");
    const totalRaw = str(fd, "total");
    const depositRaw = str(fd, "deposit");
    const b = await createAdminBooking({
      customer: { name: str(fd, "name"), email: str(fd, "email"), phone: str(fd, "phone"), notes: "" },
      type,
      itemId,
      variantId: str(fd, "variantId") || null,
      optionIds: fd.getAll("optionIds").map(String),
      date,
      startTime,
      totalOverride: totalRaw ? int(fd, "total") : null,
      depositOverride: depositRaw ? int(fd, "deposit") : null,
      status: str(fd, "status") || "CONFIRMED",
      adminNotes: str(fd, "adminNotes"),
      force: bool(fd, "force"),
    });
    revalidatePath("/admin", "layout");
    return go(`/admin/rendez-vous/${b.id}`, `Rendez-vous ${b.reference} créé — le créneau est bloqué dans le calendrier public.`);
  });
}

export async function bookingStatusAction(fd: FormData) {
  const id = str(fd, "id");
  const action = str(fd, "action");
  return safe(`/admin/rendez-vous/${id}`, async () => {
    const b = await db.booking.findUniqueOrThrow({ where: { id } });
    if (action === "cancel") {
      await cancelBooking(id, { notify: bool(fd, "notify") });
      return "Rendez-vous annulé — créneau libéré.";
    }
    if (action === "confirm") {
      const free = await isIntervalFree(db, b.date, { startMin: b.startMin, endMin: b.endMin }, b.id);
      if (!free) throw new BookingError("SLOT_TAKEN", "Impossible de confirmer : le créneau est occupé par un autre rendez-vous.");
      await db.booking.update({ where: { id }, data: { status: "CONFIRMED", confirmedAt: new Date(), lockExpiresAt: null } });
      return "Rendez-vous confirmé.";
    }
    if (action === "complete") {
      await db.booking.update({ where: { id }, data: { status: "COMPLETED" } });
      return "Marqué comme terminé.";
    }
    if (action === "noshow") {
      await db.booking.update({ where: { id }, data: { status: "NO_SHOW" } });
      return "Marqué comme no-show.";
    }
    if (action === "screenshot") {
      await db.booking.update({ where: { id }, data: { paymentScreenshotSent: !b.paymentScreenshotSent } });
      return "Preuve de paiement mise à jour (le statut du paiement n'est pas modifié).";
    }
    throw new BookingError("INVALID", "Action inconnue.");
  });
}

export async function moveBookingAction(fd: FormData) {
  const id = str(fd, "id");
  return safe(`/admin/rendez-vous/${id}`, async () => {
    const date = str(fd, "date");
    const time = str(fd, "startTime");
    await rescheduleBooking(id, date, time, { admin: true, force: bool(fd, "force") });
    return "Rendez-vous déplacé.";
  });
}

export async function saveBookingNotes(fd: FormData) {
  const id = str(fd, "id");
  return safe(`/admin/rendez-vous/${id}`, async () => {
    await db.booking.update({ where: { id }, data: { adminNotes: str(fd, "adminNotes") } });
    return "Notes enregistrées.";
  });
}

export async function markPaymentRefunded(fd: FormData) {
  return safe("/admin/paiements", async () => {
    await db.payment.update({ where: { id: str(fd, "id") }, data: { status: "REFUNDED", needsRefund: false } });
    return "Paiement marqué comme remboursé (effectuez le remboursement réel depuis votre prestataire de paiement).";
  });
}

// ───────────────────────── Disponibilités ─────────────────────────
export async function saveHours(fd: FormData) {
  return safe("/admin/disponibilites", async () => {
    for (let d = 0; d < 7; d++) {
      const start = toMin(str(fd, `start${d}`) || "09:00");
      const end = toMin(str(fd, `end${d}`) || "18:00");
      if (end <= start) throw new BookingError("INVALID", "L'heure de fin doit être après l'heure de début.");
      await db.openingHour.upsert({
        where: { weekday: d },
        update: { closed: bool(fd, `closed${d}`), startMin: start, endMin: end },
        create: { weekday: d, closed: bool(fd, `closed${d}`), startMin: start, endMin: end },
      });
    }
    return "Horaires enregistrés.";
  });
}

export async function addException(fd: FormData) {
  return safe("/admin/disponibilites", async () => {
    const date = str(fd, "date");
    if (!isDateStr(date)) throw new BookingError("INVALID", "Date invalide.");
    const closed = bool(fd, "closed");
    const startMin = toMin(str(fd, "start") || "09:00");
    const endMin = toMin(str(fd, "end") || "18:00");
    if (!closed && endMin <= startMin) throw new BookingError("INVALID", "L'heure de fin doit être après l'heure de début.");
    await db.availabilityException.upsert({
      where: { date },
      update: { closed, startMin, endMin, note: str(fd, "note") },
      create: { date, closed, startMin, endMin, note: str(fd, "note") },
    });
    return "Jour exceptionnel enregistré.";
  });
}

export async function deleteException(fd: FormData) {
  return safe("/admin/disponibilites", async () => {
    await db.availabilityException.delete({ where: { id: str(fd, "id") } });
    return "Jour exceptionnel supprimé.";
  });
}

export async function addBlocked(fd: FormData) {
  return safe("/admin/disponibilites", async () => {
    const date = str(fd, "date");
    if (!isDateStr(date)) throw new BookingError("INVALID", "Date invalide.");
    const startMin = toMin(str(fd, "start") || "09:00");
    const endMin = toMin(str(fd, "end") || "10:00");
    if (endMin <= startMin) throw new BookingError("INVALID", "L'heure de fin doit être après l'heure de début.");
    await db.blockedSlot.create({ data: { date, startMin, endMin, reason: str(fd, "reason") } });
    return "Créneau bloqué.";
  });
}

export async function deleteBlocked(fd: FormData) {
  return safe("/admin/disponibilites", async () => {
    await db.blockedSlot.delete({ where: { id: str(fd, "id") } });
    return "Créneau débloqué.";
  });
}

// ───────────────────────── Avis ─────────────────────────
export async function reviewAction(fd: FormData) {
  return safe("/admin/avis", async () => {
    const id = str(fd, "id");
    const action = str(fd, "action");
    if (action === "delete") {
      await db.review.delete({ where: { id } });
      return "Avis supprimé.";
    }
    await db.review.update({ where: { id }, data: { status: action === "approve" ? "APPROVED" : "REJECTED" } });
    revalidatePath("/avis");
    return action === "approve" ? "Avis publié." : "Avis refusé.";
  });
}

// ───────────────────────── Blog ─────────────────────────
export async function savePost(fd: FormData) {
  const id = str(fd, "id");
  return safe(id ? `/admin/blog/${id}` : "/admin/blog/nouveau", async () => {
    const title = str(fd, "title");
    if (!title) throw new BookingError("INVALID", "Le titre est obligatoire.");
    const status = ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(str(fd, "status")) ? str(fd, "status") : "DRAFT";
    const img = file(fd, "coverImage");
    const existing = id ? await db.blogPost.findUnique({ where: { id } }) : null;
    const data = {
      title,
      excerpt: str(fd, "excerpt"),
      content: String(fd.get("content") ?? ""),
      categoryId: str(fd, "categoryId") || null,
      author: str(fd, "author") || "Esther",
      status,
      ctaLabel: str(fd, "ctaLabel"),
      ctaHref: str(fd, "ctaHref"),
      publishedAt: status === "PUBLISHED" ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null,
      ...(img ? { coverImage: await saveImage(img) } : {}),
    };
    if (id) {
      await db.blogPost.update({ where: { id }, data: { ...data, slug: await uniqueSlug("blogPost", str(fd, "slug") || title, id) } });
    } else {
      const c = await db.blogPost.create({ data: { ...data, slug: await uniqueSlug("blogPost", str(fd, "slug") || title) } });
      return go(`/admin/blog/${c.id}`, "Article créé.");
    }
    revalidatePath("/blog");
    return "Article enregistré.";
  });
}

export async function deletePost(fd: FormData) {
  return safe("/admin/blog", async () => {
    await db.blogPost.delete({ where: { id: str(fd, "id") } });
    return "Article supprimé.";
  });
}

export async function addCategory(fd: FormData) {
  return safe("/admin/blog", async () => {
    const name = str(fd, "name");
    if (!name) throw new BookingError("INVALID", "Nom de catégorie manquant.");
    await db.blogCategory.upsert({ where: { slug: slugify(name) }, update: {}, create: { name, slug: slugify(name) } });
    return "Catégorie ajoutée.";
  });
}

// ───────────────────────── FAQ ─────────────────────────
export async function saveFaq(fd: FormData) {
  return safe("/admin/faq", async () => {
    const id = str(fd, "id");
    const data = { question: str(fd, "question"), answer: str(fd, "answer"), sortOrder: int(fd, "sortOrder"), active: id ? bool(fd, "active") : true };
    if (!data.question || !data.answer) throw new BookingError("INVALID", "Question et réponse sont obligatoires.");
    if (id) await db.faqItem.update({ where: { id }, data });
    else await db.faqItem.create({ data });
    revalidatePath("/faq");
    return "FAQ enregistrée.";
  });
}

export async function deleteFaq(fd: FormData) {
  return safe("/admin/faq", async () => {
    await db.faqItem.delete({ where: { id: str(fd, "id") } });
    revalidatePath("/faq");
    return "Question supprimée.";
  });
}

// ───────────────────────── Newsletter ─────────────────────────
export async function deleteSubscriber(fd: FormData) {
  return safe("/admin/newsletter", async () => {
    await db.newsletterSubscriber.delete({ where: { id: str(fd, "id") } });
    return "Abonnée supprimée.";
  });
}

// ───────────────────────── Paramètres ─────────────────────────
const IMAGE_SETTINGS: SettingKey[] = ["heroImage", "aboutImage", "reservationPacksImage", "reservationServicesImage"];

export async function saveSettings(fd: FormData) {
  return safe("/admin/parametres", async () => {
    const section = str(fd, "section");
    const keys = (Object.keys(SETTING_DEFAULTS) as SettingKey[]).filter((k) => fd.has(k) || IMAGE_SETTINGS.includes(k));
    for (const k of keys) {
      if (IMAGE_SETTINGS.includes(k)) {
        const f = file(fd, k);
        if (f) await setSetting(k, await saveImage(f));
        else if (bool(fd, `${k}__remove`)) await setSetting(k, "");
        continue;
      }
      if (fd.has(k)) await setSetting(k, String(fd.get(k) ?? "").trim());
    }
    if (section === "general") await setSetting("newsletterPopupEnabled", bool(fd, "newsletterPopupEnabled") ? "true" : "false");
    revalidatePath("/", "layout");
    return "Paramètres enregistrés.";
  });
}

export async function changePassword(fd: FormData) {
  const admin = await requireAdmin();
  return safe("/admin/parametres", async () => {
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("next") ?? "");
    if (next.length < 10) throw new BookingError("INVALID", "Le nouveau mot de passe doit contenir au moins 10 caractères.");
    if (!(await bcrypt.compare(current, admin.passwordHash))) throw new BookingError("INVALID", "Mot de passe actuel incorrect.");
    await db.user.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
    return "Mot de passe modifié.";
  });
}
