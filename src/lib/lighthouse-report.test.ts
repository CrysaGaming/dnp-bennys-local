import { describe, expect, it } from "vitest";
import { formatScores, reportLine } from "./lighthouse-report";

describe("Lighthouse-Bericht", () => {
  it("liest die zwei Kategorien und den echten Dokument-Url", () => {
    const line = reportLine({
      requestedUrl: "http://localhost:3100/dashboard",
      mainDocumentUrl: "http://localhost:3100/dashboard",
      categories: { performance: { score: 0.98 }, accessibility: { score: 1 } },
    });

    expect(line).toEqual({
      url: "http://localhost:3100/dashboard",
      redirected: false,
      performance: 0.98,
      accessibility: 1,
    });
  });

  it("eine Umleitung wird markiert – sonst steht die Zahl für die falsche Seite", () => {
    const line = reportLine({
      requestedUrl: "http://localhost:3100/dashboard",
      mainDocumentUrl: "http://localhost:3100/login",
      categories: { performance: { score: 0.9 }, accessibility: { score: 1 } },
    });

    expect(line.redirected).toBe(true);
    expect(line.url).toBe("http://localhost:3100/login");
  });

  it("fehlt eine Kategorie, steht ein Strich und nicht null", () => {
    const line = reportLine({
      requestedUrl: "http://localhost:3100/login",
      mainDocumentUrl: "http://localhost:3100/login",
      categories: { accessibility: { score: 1 } },
    });

    expect(line.performance).toBeNull();
    expect(formatScores([line])).toBe("/login – performance –, accessibility 100");
  });

  it("Zeilen werden mit Pfad und Prozent geschrieben", () => {
    const lines = [
      { url: "http://localhost:3100/login", redirected: false, performance: 0.98, accessibility: 1 },
      { url: "http://localhost:3100/dashboard", redirected: true, performance: null, accessibility: 0.94 },
    ];

    expect(formatScores(lines)).toBe(
      "/login – performance 98, accessibility 100\n/dashboard (umgeleitet) – performance –, accessibility 94",
    );
  });
});
