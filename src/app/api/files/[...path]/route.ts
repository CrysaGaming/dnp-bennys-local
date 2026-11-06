import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSessionContext } from "@/lib/dal";
import { resolveUploadPath } from "@/lib/storage";

/* Avatare sind Nutzerdaten – nichts wird gecacht oder vorgearbeitet (Spec 8). */
export const cache = "no-store" as const;

const CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
};

/**
 * Avatare aus dem Upload-Volume (Spec 5.12 / 8). Die Route prüft die Session selbst,
 * der Proxy ist keine Sicherheitsgrenze.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const ctx = await getSessionContext(req.headers);
  if (!ctx) {
    return Response.json({ error: "Bitte einloggen." }, { status: 401 });
  }

  const { path: parts } = await params;
  const rel = parts.join("/");

  let file: string;
  try {
    file = resolveUploadPath(rel);
  } catch {
    return Response.json({ error: "Der Dateipfad ist nicht erlaubt." }, { status: 403 });
  }

  const ext = path.extname(file).slice(1).toLowerCase();
  const type = CONTENT_TYPE[ext];

  if (!type) {
    return Response.json({ error: "Der Dateipfad ist nicht erlaubt." }, { status: 403 });
  }

  if (!existsSync(file)) {
    return Response.json({ error: "Das gibt es nicht." }, { status: 404 });
  }

  const bytes = await readFile(file);

  return new Response(bytes, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=86400",
    },
  });
}
