const BERLIN = "Europe/Berlin";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BERLIN,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

type BerlinParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function parts(d: Date): BerlinParts {
  const map = new Map(formatter.formatToParts(d).map((p) => [p.type, p.value]));

  return {
    year: Number(map.get("year")),
    month: Number(map.get("month")),
    day: Number(map.get("day")),
    hour: Number(map.get("hour")),
    minute: Number(map.get("minute")),
    second: Number(map.get("second")),
  };
}

/** Der Augenblick, an dem in Berlin 00:00 Uhr ist – in UTC. */
export function berlinDayStart(d: Date): Date {
  const p = parts(d);
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - d.getTime();

  return new Date(Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0) - offset);
}

export function berlinLabel(d: Date): string {
  const p = parts(d);
  return `${String(p.day).padStart(2, "0")}.${String(p.month).padStart(2, "0")}.`;
}

/**
 * Die letzten n Berliner Tage, ältester zuerst. Der Tagesbeginn wird pro Tag gerechnet, nicht
 * per 24-Stunden-Rechnung – sonst verschiebt die Umstellung auf Sommerzeit die Grenze.
 */
export function lastNDaysBerlin(n: number, now: Date): Array<{ start: Date; end: Date; label: string }> {
  const today = parts(now);
  const days: Array<{ start: Date; end: Date; label: string }> = [];

  for (let i = n - 1; i >= 0; i--) {
    // Mittagsprobe: dieser Zeitpunkt gehört garantiert zu diesem Berliner Kalenderdatum.
    const probe = new Date(Date.UTC(today.year, today.month - 1, today.day - i, 12, 0, 0));
    const start = berlinDayStart(probe);
    const end = berlinDayStart(new Date(probe.getTime() + 86_400_000));

    days.push({ start, end, label: berlinLabel(start) });
  }

  return days;
}
