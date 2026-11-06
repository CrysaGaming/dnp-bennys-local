import type { SessionContext } from "./session-types";

export type ProfileReason = "missing" | "terminated" | "banned";

/**
 * Der Zustand nach dem Login. Besser Auth kennt die Session, das Portal braucht aber die
 * Mitarbeiterkarte – ohne sie gibt es keinen Kontext (Spec 3.2). Der Name bleibt, damit die
 * Seite sagen kann, woran es liegt, statt still auf /login zurückzuwerfen.
 */
export type LoginState =
  | { kind: "none" }
  | { kind: "context"; ctx: SessionContext }
  | { kind: "no_profile"; username: string; reason: ProfileReason };

const TEXT: Record<ProfileReason, string> = {
  missing: "Kein Mitarbeiterprofil gefunden.",
  terminated: "Dein Mitarbeiterprofil ist nicht mehr aktiv.",
  banned: "Dein Zugang ist gesperrt.",
};

export function loginNotice(state: LoginState): string | null {
  return state.kind === "no_profile" ? TEXT[state.reason] : null;
}
