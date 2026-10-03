import { db } from "./db";

export async function getActivePackages() {
  const rows = await db.package.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: { variants: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  return rows.map((p) => ({
    ...p,
    fromPrice: p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.basePrice,
    hasVariants: p.variants.length > 1,
  }));
}

export async function getPackageBySlug(slug: string) {
  const p = await db.package.findUnique({
    where: { slug },
    include: { variants: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!p || !p.active) return null;
  return { ...p, fromPrice: p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : p.basePrice };
}

export async function getActiveServices() {
  return db.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } });
}

export async function getServiceBySlug(slug: string) {
  const s = await db.service.findUnique({ where: { slug } });
  return s && s.active ? s : null;
}

export async function getOptionsFor(scope: "PACKAGE" | "SERVICE") {
  return db.serviceOption.findMany({
    where: { active: true, scope: { in: [scope, "BOTH"] } },
    orderBy: { sortOrder: "asc" },
  });
}
