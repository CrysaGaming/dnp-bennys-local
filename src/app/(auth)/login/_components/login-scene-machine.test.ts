import { describe, expect, it } from "vitest";
import { loginSceneReducer } from "./login-scene-machine";

describe("loginSceneReducer", () => {
  const init = { phase: "intro", banner: null } as const;

  it("startet die Szene nach der Nutzeraktion", () => {
    expect(loginSceneReducer(init, { type: "START" })).toEqual({ phase: "scene", banner: null });
  });

  it("zeigt das Banner bei einem Fehler", () => {
    expect(loginSceneReducer({ phase: "scene", banner: null }, { type: "LOGIN_ERROR" })).toEqual({
      phase: "scene",
      banner: "denied",
    });
  });

  it("blendet das Banner nach der Einblendung wieder aus", () => {
    expect(loginSceneReducer({ phase: "scene", banner: "denied" }, { type: "BANNER_DONE" })).toEqual({
      phase: "scene",
      banner: null,
    });
  });

  it("geht bei Erfolg in den Erfolgszustand mit Willkommensbanner", () => {
    expect(loginSceneReducer({ phase: "scene", banner: null }, { type: "LOGIN_SUCCESS" })).toEqual({
      phase: "success",
      banner: "welcome",
    });
  });

  it("ignoriert Fehler im Intro", () => {
    expect(loginSceneReducer(init, { type: "LOGIN_ERROR" })).toEqual(init);
  });

  it("ignoriert Erfolge im Intro", () => {
    expect(loginSceneReducer(init, { type: "LOGIN_SUCCESS" })).toEqual(init);
  });
});
