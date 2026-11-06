const MINUTE_MS = 60_000;

/** Minuten von Beginn bis Ende – offene Einträge bis `now`, abgerundet (Spec 7.4). */
export function entryMinutes(e: { clockIn: Date; clockOut: Date | null }, now: Date): number {
  const end = e.clockOut ?? now;

  return Math.max(0, Math.floor((end.getTime() - e.clockIn.getTime()) / MINUTE_MS));
}

export function sumMinutes(
  entries: Array<{ clockIn: Date; clockOut: Date | null }>,
  now: Date,
): number {
  return entries.reduce((sum, e) => sum + entryMinutes(e, now), 0);
}

/** Stundenlohn ist Dollar pro Stunde (Spec 4.4 A4): gerundet auf ganze Dollar. */
export function wagePreview(minutes: number, hourlyWage: number): number {
  return Math.round((minutes / 60) * hourlyWage);
}

const TIME_ZONE = "Europe/Berlin";

type BerlinParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function berlinParts(d: Date): BerlinParts {
  const parts = new Intl.DateTimeFormat("de-DE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Minuten, die Berlin voraus ist – um Mitternacht liegt der Zeitumstellungs-Sprung,
 * deshalb wird der Offset über die Mitte des Tages geholt. */
function berlinOffsetMinutes(d: Date): number {
  const p = berlinParts(d);

  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - d.getTime()) / MINUTE_MS;
}

/** Montag 00:00 Ortszeit, als UTC-Instant (Spec 5.7). */
export function weekStartBerlin(d: Date): Date {
  const p = berlinParts(d);
  const localDay = Date.UTC(p.year, p.month - 1, p.day);
  const daysSinceMonday = (new Date(localDay).getUTCDay() + 6) % 7;
  const mondayLocal = localDay - daysSinceMonday * 24 * 60 * MINUTE_MS;

  return new Date(mondayLocal - berlinOffsetMinutes(new Date(mondayLocal + 12 * 60 * MINUTE_MS)) * MINUTE_MS);
}

/** hh:mm:ss für die laufende Zeit (Spec 5.7). */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds].map((v) => String(v).padStart(2, "0")).join(":");
}
