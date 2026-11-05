import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/dal";
import { toActionError } from "@/lib/errors";
import type { SessionContext } from "@/lib/session-types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type RunActionOptions = {
  /** `[ Pfad, Typ ]` – Typ wie `revalidatePath` (Standard: "page"). */
  revalidate?: Array<[path: string, type?: "layout" | "page"]>;
  allowMustChangePassword?: boolean;
};

/** Dünner Wrapper: Session holen, Fachfunktion rufen, Routen revalidieren, Fehler übersetzen. */
export async function runAction<T>(
  fn: (ctx: SessionContext) => Promise<T>,
  opts: RunActionOptions = {},
): Promise<ActionResult<T>> {
  try {
    const ctx = await requireSession({ allowMustChangePassword: opts.allowMustChangePassword });
    const data = await fn(ctx);

    for (const [path, type] of opts.revalidate ?? []) {
      revalidatePath(path, type);
    }

    return { ok: true, data };
  } catch (e) {
    // `redirect()` wirft mit einem NEXT_REDIRECT-Digest – das darf nicht zur Fehlermeldung werden.
    if (
      typeof e === "object" &&
      e !== null &&
      typeof (e as { digest?: unknown }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      throw e;
    }

    const result = toActionError(e);
    return result.fieldErrors ? { ok: false, error: result.error, fieldErrors: result.fieldErrors } : { ok: false, error: result.error };
  }
}
