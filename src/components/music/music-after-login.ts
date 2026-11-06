/**
 * Was passiert mit dem Song nach dem Login (Spec 6.4): hat der User Dashboard-Musik an,
 * läuft er nahtlos weiter – sonst wird er über 0,8 s ausgeblendet.
 */
export type MusicDecision = "continue" | "fade-out";

export function musicAfterLogin(pref: { dashboardMusic: boolean } | null): MusicDecision {
  return pref?.dashboardMusic ? "continue" : "fade-out";
}
