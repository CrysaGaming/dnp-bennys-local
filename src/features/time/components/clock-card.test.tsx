import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ClockCard } from "./clock-card";

const clockInAction = vi.fn(async () => ({ ok: true, data: null }));
const clockOutAction = vi.fn(async () => ({ ok: true, data: null }));

vi.mock("../actions", () => ({
  clockInAction: () => clockInAction(),
  clockOutAction: () => clockOutAction(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-05T12:00:00.000Z"));
  clockInAction.mockClear();
  clockOutAction.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ClockCard", () => {
  it("zeigt die laufende Zeit und Ausstempeln, wenn ein offener Eintrag da ist", async () => {
    render(<ClockCard openSince={new Date("2026-11-05T10:36:15.000Z")} />);

    // Der erste Tick ist ein 0-ms-Timeout – mit fake timers muss er ausgeführt werden.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(screen.getByText("01:23:45")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ausstempeln" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Einstempeln" })).not.toBeInTheDocument();
  });

  it("zeigt Einstempeln, wenn nichts offen ist", () => {
    render(<ClockCard openSince={null} />);

    expect(screen.getByRole("button", { name: "Einstempeln" })).toBeInTheDocument();
  });

  it("stempelt per Action", async () => {
    render(<ClockCard openSince={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Einstempeln" }));
    await vi.waitFor(() => expect(clockInAction).toHaveBeenCalled());
  });
});
