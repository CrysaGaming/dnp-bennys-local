"use server";

import { runAction, type ActionResult } from "@/lib/action";
import { passwordChangeSchema } from "@/features/auth/schemas";
import { completePasswordChange } from "./service";

/** Dünne Action: das Passwort selbst ändert Better Auth, hier nur Flag + Audit. */
export async function completePasswordChangeAction(input: unknown): Promise<ActionResult<void>> {
  return runAction(
    async (ctx) => {
      passwordChangeSchema.parse(input);
      await completePasswordChange(ctx);
    },
    {
      // Der Wechsel passiert beim ersten Login, das Flag ist noch gesetzt. Nach dem
      // Erfolg zeigen sowohl die Passwortseite als auch das Dashboard neue Daten.
      allowMustChangePassword: true,
      revalidate: [["/settings", "page"], ["/dashboard", "page"]],
    },
  );
}
