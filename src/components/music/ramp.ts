/**
 * Lineare Lautstärke-Rampe (Spec 6.4): 2 s rein, 0,8 s raus. Begrenzt auf 0–1.
 * Nach dem Ende bleibt der Wert auf `to`.
 */
export function rampVolume(from: number, to: number, durationMs: number, elapsedMs: number): number {
  if (durationMs <= 0) return clamp(to);

  const progress = Math.min(Math.max(elapsedMs / durationMs, 0), 1);
  return clamp(from + (to - from) * progress);
}

function clamp(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}
