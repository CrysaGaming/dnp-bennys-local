import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BusinessRuleError, ForbiddenError } from "@/lib/errors";

/**
 * Avatar-Upload (Spec 8 / Plan 01 Task 2.6). Lokal in einem Volume, später optional S3.
 * Der Originalname wird nie verwendet – sicher sind nur die Magic Bytes und ein Zufallsname.
 */

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export type ImageType = "png" | "jpg" | "webp";

/** Nur diese drei Typ sind erlaubt (Spec 8), erkannt an den Magic Bytes, nicht am MIME-Typ. */
export function detectImageType(bytes: Uint8Array): ImageType | null {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0, bytes[3] ?? 0) === "RIFF" &&
    String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

/** Ein Pfad bleibt innerhalb des Upload-Ordners. `..` und absolute Pfade sind abgelehnt. */
export function resolveUploadPath(rel: string): string {
  const base = path.resolve(UPLOAD_DIR);

  if (path.isAbsolute(rel)) {
    throw new ForbiddenError("Der Dateipfad ist nicht erlaubt.");
  }

  const abs = path.resolve(base, rel);

  if (abs !== base && !abs.startsWith(base + path.sep)) {
    throw new ForbiddenError("Der Dateipfad ist nicht erlaubt.");
  }

  return path.join(UPLOAD_DIR, rel);
}

/**
 * Schreibt die Datei unter `<zufall>.<endung>` und gibt die URL zurück, über die
 * sie später ausgeliefert wird (`/api/files/avatars/...`).
 */
export async function saveAvatar(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (bytes.byteLength > MAX_AVATAR_BYTES) {
    throw new BusinessRuleError("Das Bild ist größer als 2 MB.");
  }

  const type = detectImageType(bytes);

  if (!type) {
    throw new BusinessRuleError("Das Bild ist kein PNG, JPG oder WebP.");
  }

  const name = `${randomUUID()}.${type}`;
  const dir = path.join(UPLOAD_DIR, "avatars");

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);

  return `/api/files/avatars/${name}`;
}
