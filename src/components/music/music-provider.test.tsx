import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MusicProvider, TRACK_TITLE, useMusic, type MusicState } from "./music-provider";

/**
 * Die Probe gibt den Zustand als Text aus und die Aktionen als Buttons – so bleibt der
 * Test rein über den DOM lesbar und die Probe selbst ohne Seiteneffekt im Render.
 */
function Probe() {
  const api = useMusic();

  const state: MusicState = {
    available: api.available,
    playing: api.playing,
    blocked: api.blocked,
    muted: api.muted,
    volume: api.volume,
  };

  return (
    <div>
      <span data-testid="state">{JSON.stringify(state)}</span>
      <button onClick={() => void api.start()}>start</button>
      <button onClick={() => api.stop()}>stop</button>
      <button onClick={() => api.setMuted(true)}>mute</button>
      <button onClick={() => void api.fadeTo(0.2, 0)}>fade</button>
    </div>
  );
}

function readState(): MusicState {
  return JSON.parse(screen.getByTestId("state").textContent ?? "{}") as MusicState;
}

async function clickAndWait(name: string): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name }));
    await Promise.resolve();
  });
}

function mount(): HTMLMediaElement {
  render(
    <MusicProvider>
      <Probe />
    </MusicProvider>,
  );

  return document.querySelector("audio") as HTMLMediaElement;
}

describe("music-provider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("nennt den Song", () => {
    expect(TRACK_TITLE).toBe("Straßen im Blut");
  });

  it("lädt die Quelle erst beim Start und spielt dann", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    const audio = mount();

    expect(audio.getAttribute("src")).toBeNull();

    await clickAndWait("start");

    expect(readState()).toMatchObject({ playing: true, blocked: false, available: true });
    expect(play).toHaveBeenCalled();
    expect(audio.getAttribute("src")).toBe("/audio/strassen-im-blut.mp3");
    expect(audio.loop).toBe(true);
  });

  it("ein abgelehntes play() ist der Zustand blocked, kein Fehler", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.reject(new Error("blockiert")));
    mount();

    await clickAndWait("start");

    expect(readState()).toMatchObject({ blocked: true, playing: false });
  });

  it("startet nicht, wenn Mute gespeichert ist", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    localStorage.setItem("bennys:login-muted", "true");
    mount();

    expect(readState().muted).toBe(true);

    await clickAndWait("start");

    expect(play).not.toHaveBeenCalled();
    expect(readState().playing).toBe(false);
  });

  it("stummschalten wirkt auf das Element und bleibt gespeichert", async () => {
    const audio = mount();

    await clickAndWait("mute");

    expect(audio.muted).toBe(true);
    expect(readState().muted).toBe(true);
    expect(localStorage.getItem("bennys:login-muted")).toBe("true");
  });

  it("stop() pausiert und setzt den Zustand zurück", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => Promise.resolve());
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    mount();

    await clickAndWait("start");
    await clickAndWait("stop");

    expect(pause).toHaveBeenCalled();
    expect(readState().playing).toBe(false);
  });

  it("ein Fehler am Element macht den Player unsichtbar", async () => {
    const audio = mount();

    await act(async () => {
      audio.dispatchEvent(new Event("error"));
    });

    expect(readState().available).toBe(false);
  });

  it("fadeTo setzt die Lautstärke, ohne Frame-Kader", async () => {
    const audio = mount();

    await clickAndWait("fade");

    expect(audio.volume).toBe(0.2);
  });
});
