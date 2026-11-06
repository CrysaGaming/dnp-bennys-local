import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { formatMoney } from "@/lib/format";
import { CountUp } from "./count-up";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

describe("CountUp", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("zählt über 800 ms bis zum Wert", () => {
    stubMatchMedia(false);
    render(<CountUp value={1200} format={formatMoney} />);

    // Der erste Render ist auf Server und Client gleich – sonst ist es ein Hydrationsfehler.
    expect(screen.getByText("$0")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(400));
    expect(screen.queryByText("$1.200")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByText("$1.200")).toBeInTheDocument();
  });

  it("reduzierte Bewegung zeigt den Wert sofort", () => {
    stubMatchMedia(true);
    render(<CountUp value={1200} format={formatMoney} />);

    // Der Wert kommt im ersten Tick nach der Hydration – ein setTimeout(0) läuft erst, wenn die
    // Timer ein Stück weitergehen, desshalb hier eine Millisekunde.
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByText("$1.200")).toBeInTheDocument();
  });
});
