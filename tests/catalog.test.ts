import { describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { computeQuote } from "@/lib/pricing";
import { formatDurationLong, parseInfoNotes, withDuration } from "@/lib/format";

describe("catalogue demandé par la cliente (3/10/2026)", () => {
  it("prestations : prix et durées", async () => {
    const get = (slug: string) => db.service.findUniqueOrThrow({ where: { slug } });
    expect(await get("pose-perruque")).toMatchObject({ price: 70, durationMinutes: 120, depositAmount: 20 });
    expect(await get("pose-perruque-closure")).toMatchObject({ price: 65, durationMinutes: 120 });
    expect(await get("tissage-ouvert")).toMatchObject({ price: 80, durationMinutes: 180 });
    expect(await db.service.count({ where: { slug: "tissage-ouvert-flipover" } })).toBe(0);
  });

  it("pack Tissage Closure 2x6 : 3 longueurs (20\" 350€, 22\" 365€, 24\" 385€)", async () => {
    const pkg = await db.package.findUniqueOrThrow({ where: { slug: "tissage-closure" }, include: { variants: { orderBy: { sortOrder: "asc" } } } });
    expect(pkg.variants.map((v) => [v.label, v.price])).toEqual([["20 pouces", 350], ["22 pouces", 365], ["24 pouces", 385]]);
    const q = await computeQuote({ type: "PACKAGE", itemId: pkg.id, variantId: pkg.variants[2].id });
    expect(q.ok && [q.total, q.deposit, q.remaining]).toEqual([385, 50, 335]);
  });

  it("pack Balayage : 400€, 3 bundles de 20\" Raw Hair vietnamien dont 1 balayé", async () => {
    const pkg = await db.package.findUniqueOrThrow({ where: { slug: "tissage-balayage" } });
    expect(pkg.basePrice).toBe(400);
    expect(pkg.description).toContain("**3 bundles de 20 pouces**");
    expect(pkg.features.split("|")).toHaveLength(5);
  });

  it("options retirées : Coupe, Soin profond et Baby hair ne sont plus proposées", async () => {
    const active = (await db.serviceOption.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } })).map((o) => o.name);
    expect(active).toEqual(["Coloration", "Wavy / boucles"]);
    const coupe = await db.serviceOption.findFirstOrThrow({ where: { name: "Coupe" } });
    const pkg = await db.package.findUniqueOrThrow({ where: { slug: "flipover" }, include: { variants: true } });
    expect(await computeQuote({ type: "PACKAGE", itemId: pkg.id, variantId: pkg.variants[0].id, optionIds: [coupe.id] })).toMatchObject({ ok: false, error: "OPTION_INVALID" });
  });
});

describe("textes riches", () => {
  it("durée en toutes lettres", () => {
    expect(formatDurationLong(120)).toBe("2 heures");
    expect(formatDurationLong(180)).toBe("3 heures");
    expect(formatDurationLong(60)).toBe("1 heure");
    expect(withDuration("Durabilité **{duration}**", 180)).toBe("Durabilité **3 heures**");
  });

  it("notes « informations importantes » : une note par icône, les retours à la ligne sont conservés", () => {
    const notes = parseInfoNotes("calendar|A\nbraids|Merci de venir avec des nattes.\nSi ce n'est pas le cas, +10€\nshower|C");
    expect(notes).toEqual(["calendar|A", "braids|Merci de venir avec des nattes.\nSi ce n'est pas le cas, +10€", "shower|C"]);
  });
});
