import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { existsSync, rmSync } from "node:fs";
import path from "node:path";
import { saveImage, UploadError, UPLOAD_DIR } from "@/lib/upload";

describe("upload d'images", () => {
  it("convertit une image valide en WebP optimisé", async () => {
    const png = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#aa8866" } }).png().toBuffer();
    const url = await saveImage(new File([png], "photo.png", { type: "image/png" }));
    expect(url).toMatch(/^\/uploads\/[0-9a-f-]+\.webp$/);
    const file = path.join(UPLOAD_DIR(), path.basename(url));
    expect(existsSync(file)).toBe(true);
    expect((await sharp(file).metadata()).width).toBe(1800); // redimensionnée
    rmSync(file);
  });

  it("refuse un faux fichier image et un format non autorisé", async () => {
    await expect(saveImage(new File(["<?php echo 1; ?>"], "x.jpg", { type: "image/jpeg" }))).rejects.toBeInstanceOf(UploadError);
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#fff" } }).gif().toBuffer();
    await expect(saveImage(new File([gif], "a.gif", { type: "image/gif" }))).rejects.toThrow(/JPG, PNG, WEBP/);
  });

  it("refuse un fichier trop lourd", async () => {
    const big = new File([new Uint8Array(7 * 1024 * 1024)], "big.png", { type: "image/png" });
    await expect(saveImage(big)).rejects.toThrow(/trop lourde/);
  });
});
