import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BusinessRuleError, ForbiddenError } from "@/lib/errors";
import { UPLOAD_DIR, detectImageType, resolveUploadPath, saveAvatar } from "@/lib/storage";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 1, 2, 3, 4,
]);

const bigFile = () =>
  new File([new Uint8Array(2 * 1024 * 1024 + 1)], "x.png", { type: "image/png" });

describe("storage", () => {
  it("erkennt PNG, JPG und WebP an den Magic Bytes", () => {
    expect(detectImageType(PNG)).toBe("png");
    expect(detectImageType(JPG)).toBe("jpg");
    expect(detectImageType(WEBP)).toBe("webp");
    expect(detectImageType(new Uint8Array([0, 1, 2, 3]))).toBeNull();
  });

  it("lehnt einen Pfad ab, der aus dem Upload-Ordner führt", () => {
    expect(() => resolveUploadPath("../etc/passwd")).toThrow(ForbiddenError);
    expect(() => resolveUploadPath("/etc/passwd")).toThrow(ForbiddenError);
    expect(resolveUploadPath("avatars/abc.png")).toBe(
      path.join(process.env.UPLOAD_DIR ?? "uploads", "avatars", "abc.png"),
    );
  });

  it("lehnt mehr als 2 MB ab", async () => {
    const file = bigFile();
    // Es wird nichts geschrieben, bevor die Größe geprüft ist.
    expect(existsSync(path.join(UPLOAD_DIR, "avatars", "x.png"))).toBe(false);
    await expect(saveAvatar(file)).rejects.toThrow(BusinessRuleError);
  });

  it("nutzt den Upload-Ordner aus der Umgebung", () => {
    expect(UPLOAD_DIR).toBe(process.env.UPLOAD_DIR ?? "uploads");
  });

  it("saveAvatar schreibt unter einem Zufallsnamen und gibt die URL zurück", async () => {
    const dir = path.join(UPLOAD_DIR, "avatars");
    await mkdir(dir, { recursive: true });

    const url = await saveAvatar(new File([PNG], "name.png", { type: "image/png" }));
    expect(url).toMatch(/^\/api\/files\/avatars\/[0-9a-f-]{36}\.png$/);
    expect(existsSync(path.join(dir, path.basename(url)))).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });

  it("saveAvatar lehnt eine Datei ab, die größer als 2 MB ist", async () => {
    await expect(saveAvatar(bigFile())).rejects.toThrow(BusinessRuleError);
  });

  it("saveAvatar lehnt eine Datei ab, deren Magic Bytes nicht zum MIME-Typ passen", async () => {
    const fake = new File([new Uint8Array([0, 1, 2, 3])], "fake.png", { type: "image/png" });
    await expect(saveAvatar(fake)).rejects.toThrow(BusinessRuleError);
    expect(existsSync(path.join(UPLOAD_DIR, "avatars", "fake.png"))).toBe(false);
  });
});
