"use server";

import { runAction, type ActionResult } from "@/lib/action";
import { ActionError } from "@/lib/errors";
import { passwordChangeSchema } from "@/features/auth/schemas";
import { saveAvatar } from "@/lib/storage";
import {
  completePasswordChange,
  setAvatar,
  updatePreferences,
  updateProfile,
  type Preferences,
  type Profile,
} from "./service";

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

/** Eigenes Profil (Spec 5.12): Name und Telefon, niemand anders darf hier schreiben. */
export async function updateProfileAction(input: unknown): Promise<ActionResult<Profile>> {
  return runAction(
    async (ctx) => {
      return updateProfile(ctx, input);
    },
    { revalidate: [["/profil", "page"], ["/dashboard", "page"]] },
  );
}

/** Der Upload geht als FormData durch die Action; geprüft wird über die Magic Bytes (Spec 8). */
export async function uploadAvatarAction(formData: FormData): Promise<ActionResult<string>> {
  return runAction(
    async (ctx) => {
      const file = formData.get("datei");

      if (!(file instanceof File)) {
        throw new ActionError("Bitte eine Bilddatei auswählen.");
      }

      const url = await saveAvatar(file);
      await setAvatar(ctx, url);
      return url;
    },
    { revalidate: [["/profil", "page"], ["/settings", "page"], ["/dashboard", "page"]] },
  );
}

export async function removeAvatarAction(): Promise<ActionResult<string | null>> {
  return runAction(
    async (ctx) => setAvatar(ctx, null),
    { revalidate: [["/profil", "page"], ["/settings", "page"], ["/dashboard", "page"]] },
  );
}

/** Theme und Bewegung (Spec 5.12). Das Layout liest die Werte für next-themes und motion. */
export async function updatePreferencesAction(input: unknown): Promise<ActionResult<Preferences>> {
  return runAction(
    async (ctx) => {
      return updatePreferences(ctx, input);
    },
    { revalidate: [["/settings", "page"], ["/dashboard", "page"]] },
  );
}
