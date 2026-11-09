const numberFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 });
const dateTimeFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  dateStyle: "medium",
  timeStyle: "short",
});

/** Geld in ganzen Dollar: `$12.500`, `-$250`. */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}$${new Intl.NumberFormat("de-DE").format(Math.abs(amount))}`;
}

/** Punkte oder Stempel: `4.300`, `240`. Kein Dollarzeichen – beides sind Einheiten. */
export function formatPoints(value: number): string {
  return new Intl.NumberFormat("de-DE").format(value);
}

/** Gewicht in kg (Eingang Gramm): `1,5 kg`, `25 kg`, `0,125 kg`. */
export function formatKg(grams: number): string {
  return `${numberFormat.format(grams / 1000)} kg`;
}

/**
 * kg-Eingabe in Gramm. Punkt und Komma sind Dezimaltrenner (Review Focus 1),
 * maximal 3 Nachkommastellen, Bereich 0–10.000 kg. Sonst null.
 */
export function parseKgToGrams(input: string): number | null {
  const value = input.trim();
  if (!/^\d{1,5}([.,]\d{1,3})?$/.test(value)) return null;

  const kg = Number(value.replace(",", "."));
  if (!Number.isFinite(kg) || kg > 10_000) return null;

  return Math.round(kg * 1000);
}

/** UTC-Speicherzeit in Europe/Berlin: `06.11.2026, 00:30`. */
export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

/** Minuten als `2:15 h`. */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.abs(minutes % 60);
  return `${hours}:${String(mins).padStart(2, "0")} h`;
}

/** `Funk 1234 (0000)`; ohne Kanal null, ohne Passwort ohne Klammer. */
export function formatRadio(
  channel: string | null,
  password: string | null,
): string | null {
  const trimmed = channel?.trim();
  if (!trimmed) return null;
  const pw = password?.trim();
  return pw ? `Funk ${trimmed} (${pw})` : `Funk ${trimmed}`;
}
