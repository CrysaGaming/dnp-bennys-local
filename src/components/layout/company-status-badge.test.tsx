import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { CompanyStatusBadge } from "./company-status-badge";
import type { CompanyStatus } from "@/lib/company-status";

const OPEN: CompanyStatus = { isOpen: true, mode: "AUTO", onDutyCount: 1 };

function mockFetch(status: CompanyStatus) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => status });
}

describe("CompanyStatusBadge", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("zeigt den Anfangszustand", () => {
    render(<CompanyStatusBadge initial={OPEN} />);

    expect(screen.getByText("GEÖFFNET")).toBeInTheDocument();
  });

  it("holt alle 30 Sekunden den neuen Status", async () => {
    const fetchMock = mockFetch({ ...OPEN, isOpen: false, onDutyCount: 0 });
    vi.stubGlobal("fetch", fetchMock);

    render(<CompanyStatusBadge initial={OPEN} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("GESCHLOSSEN")).toBeInTheDocument();
  });

  it("pollt nicht, während der Tab versteckt ist", async () => {
    const fetchMock = mockFetch({ ...OPEN, isOpen: false });
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });

    render(<CompanyStatusBadge initial={OPEN} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(90_000);
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText("GEÖFFNET")).toBeInTheDocument();
  });

  it("bleibt beim letzten bekannten Status, wenn der Abruf fehlschlägt", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Netzwerk"));
    vi.stubGlobal("fetch", fetchMock);

    render(<CompanyStatusBadge initial={OPEN} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(screen.getByText("GEÖFFNET")).toBeInTheDocument();
  });
});
