import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MusicToggle } from "./music-toggle";

const setMusicPreferenceAction = vi.fn(async (input: unknown) => ({ ok: true, data: input }));

vi.mock("@/features/account/actions", () => ({
  setMusicPreferenceAction: (input: unknown) => setMusicPreferenceAction(input),
}));

const music = {
  available: true,
  playing: false,
  blocked: false,
  muted: false,
  volume: 0.35,
  start: vi.fn(async () => true),
  stop: vi.fn(),
  setMuted: vi.fn(),
  setVolume: vi.fn(),
  fadeTo: vi.fn(async () => undefined),
};

vi.mock("@/components/music/music-provider", () => ({
  useMusic: () => music,
  TRACK_TITLE: "Straßen im Blut",
}));

beforeEach(() => {
  setMusicPreferenceAction.mockClear();
  music.start.mockClear();
  music.stop.mockClear();
  music.playing = false;
});

describe("MusicToggle", () => {
  it("startet und speichert an, wenn die Einstellung aus ist", async () => {
    render(<MusicToggle initial={{ dashboardMusic: false, musicVolume: 35 }} />);

    const button = screen.getByRole("button", { name: /Musik/ });
    expect(button).toHaveAttribute("data-state", "off");

    fireEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(music.start).toHaveBeenCalled();
    expect(setMusicPreferenceAction).toHaveBeenCalledWith({
      dashboardMusic: true,
      musicVolume: 35,
    });
  });

  it("stoppt und speichert aus, wenn die Musik läuft", async () => {
    music.playing = true;

    render(<MusicToggle initial={{ dashboardMusic: true, musicVolume: 60 }} />);

    const button = screen.getByRole("button", { name: /Musik/ });
    expect(button).toHaveAttribute("data-state", "playing");

    fireEvent.click(button);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(music.stop).toHaveBeenCalled();
    expect(setMusicPreferenceAction).toHaveBeenCalledWith({
      dashboardMusic: false,
      musicVolume: 60,
    });
  });

  it("zeigt „pausiert“, wenn die Einstellung an, das Abspielen aber blockiert ist", () => {
    music.playing = false;

    render(<MusicToggle initial={{ dashboardMusic: true, musicVolume: 35 }} />);

    expect(screen.getByRole("button", { name: /Musik/ })).toHaveAttribute("data-state", "paused");
  });
});
