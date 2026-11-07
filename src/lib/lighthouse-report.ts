export type ReportLine = {
  url: string;
  redirected: boolean;
  performance: number | null;
  accessibility: number | null;
};

type ReportLike = {
  requestedUrl?: string;
  mainDocumentUrl?: string;
  categories?: Record<string, { score?: number | null }>;
};

/**
 * Ein Lighthouse-JSON in eine lesbare Zeile. Der entscheidende Punkt: `mainDocumentUrl` kann eine
 * Umleitung sein – dann steht die Zahl für eine andere Seite als die angeforderte.
 */
export function reportLine(json: ReportLike): ReportLine {
  const requested = json.requestedUrl ?? "";
  const actual = json.mainDocumentUrl ?? requested;

  return {
    url: actual,
    redirected: actual !== requested,
    performance: json.categories?.performance?.score ?? null,
    accessibility: json.categories?.accessibility?.score ?? null,
  };
}

function percent(score: number | null): string {
  return score === null ? "–" : String(Math.round(score * 100));
}

export function formatScores(lines: ReportLine[]): string {
  return lines
    .map((line) => {
      const path = new URL(line.url).pathname;
      const where = line.redirected ? `${path} (umgeleitet)` : path;
      return `${where} – performance ${percent(line.performance)}, accessibility ${percent(line.accessibility)}`;
    })
    .join("\n");
}
