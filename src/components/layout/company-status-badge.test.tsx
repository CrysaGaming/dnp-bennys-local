import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { CompanyStatusBadge } from "./company-status-badge";
import type { CompanyStatus } from "@/lib/company-status";

const OPEN: CompanyStatus = { isOpen: true, mode: "AUTO", onDutyCount: 1 };

function mockFetch(status: CompanyStatus) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => status });
}

describe("CompanyStatusBadge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Der versteckte-Tab-Test setzt document.hidden – ohne dieses Zurücksetzen läuft er
    // in die folgenden Tests hinein.
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
  });
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

  it("lässt den neuen Server-Wert gewinnen, wenn er nach dem alten Poll kommt", async () => {
    // Regression: nach dem Stempeln revalidiert die Action das Layout. Der Badge darf
    // nicht auf dem älteren Poll stehen bleiben.
    const fetchMock = mockFetch({ ...OPEN, isOpen: false });
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(<CompanyStatusBadge initial={OPEN} />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(screen.getByText("GESCHLOSSEN")).toBeInTheDocument();

    rerender(<CompanyStatusBadge initial={{ ...OPEN }} />);

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
