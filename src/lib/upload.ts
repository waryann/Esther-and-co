import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const UPLOAD_DIR = () => path.resolve(process.env.UPLOAD_DIR || "./uploads");

const MAX_BYTES = 6 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const ALLOWED = new Set(["jpeg", "png", "webp"]);

export class UploadError extends Error {}

/**
 * Valide (type réel via le contenu, poids, dimensions), redimensionne et convertit en WebP.
 * Retourne l'URL publique servie par /uploads/[...path].
 */
export async function saveImage(file: File, maxWidth = 1800): Promise<string> {
  if (!file || file.size === 0) throw new UploadError("Aucun fichier.");
  if (file.size > MAX_BYTES) throw new UploadError("Image trop lourde (6 Mo maximum).");
  const input = Buffer.from(await file.arrayBuffer());
  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch {
    throw new UploadError("Fichier image invalide.");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) throw new UploadError("Formats acceptés : JPG, PNG, WEBP.");
  if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_PIXELS) throw new UploadError("Dimensions de l'image trop grandes.");
  const out = await sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const name = `${randomUUID()}.webp`;
  const dir = UPLOAD_DIR();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), out);
  return `/uploads/${name}`;
}
