export type CursorValue = { createdAt: Date; id: string };

/** Cursor als base6url-JSON (Spec 5.13). base64url passt in eine URL ohne Zeichen zum Maskieren. */
export function encodeCursor(cursor: CursorValue): string {
  return Buffer.from(JSON.stringify({ t: cursor.createdAt.toISOString(), id: cursor.id })).toString("base64url");
}

/** Was nicht lesbar ist, ist kein Cursor – es wird null, keine Ausnahme. */
export function decodeCursor(value: string): CursorValue | null {
  if (value === "") return null;

  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { t?: unknown; id?: unknown };

    if (typeof parsed.t !== "string" || typeof parsed.id !== "string") return null;

    const createdAt = new Date(parsed.t);
    if (Number.isNaN(createdAt.getTime())) return null;

    return { createdAt, id: parsed.id };
  } catch {
    return null;
  }
}
