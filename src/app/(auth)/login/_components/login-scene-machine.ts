/**
 * Zustandsautomat der Login-Szene (Spec 6.1). Der Automat ist bewusst rein – die
 * Komponenten entscheiden, was sie daraus zeigen.
 */
export type SceneBanner = "denied" | "welcome" | null;

export type SceneState = {
  phase: "intro" | "scene" | "success";
  banner: SceneBanner;
};

export type SceneEvent =
  | { type: "START" }
  | { type: "LOGIN_ERROR" }
  | { type: "BANNER_DONE" }
  | { type: "LOGIN_SUCCESS" };

export function loginSceneReducer(state: SceneState, event: SceneEvent): SceneState {
  switch (event.type) {
    case "START":
      return state.phase === "intro" ? { phase: "scene", banner: null } : state;

    case "LOGIN_ERROR":
      // Im Intro gibt es kein Formular, also auch keinen Fehler.
      return state.phase === "scene" ? { ...state, banner: "denied" } : state;

    case "BANNER_DONE":
      return { ...state, banner: null };

    case "LOGIN_SUCCESS":
      return state.phase === "scene" ? { phase: "success", banner: "welcome" } : state;
  }
}
