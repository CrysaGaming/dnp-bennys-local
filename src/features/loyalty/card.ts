/**
 * Eine volle Karte ist noch die aktuelle Karte – sie wird erst gezählt, wenn Stempel darüber
 * hinausgehen. Darum zeigt die Karte bei genau `cardSize` noch zehn Felder.
 */
export function stampCardView(balance: number, cardSize: number): { fullCards: number; current: number } {
  if (cardSize <= 0) return { fullCards: 0, current: balance };

  const fullCards = balance > cardSize ? Math.floor((balance - 1) / cardSize) : 0;

  return { fullCards, current: balance - fullCards * cardSize };
}

/** Die Drehung pro Stempel, deterministisch und im Bereich −8…8 (Spec 5.6). */
export function stampRotation(index: number): number {
  return ((index * 5) % 17) - 8;
}

/** Fortschritt zum Balken in Prozent, ohne Prämie oder mit Kosten 0 bleibt er leer. */
export function pointsProgress(balance: number, cost: number): number {
  if (cost <= 0) return 0;
  return Math.min(100, Math.round((balance / cost) * 100));
}

/** Die nächste Prämie ist die billigste, die das Guthaben noch nicht deckt. */
export function nextReward<T extends { name: string; cost: number }>(rewards: T[], balance: number): T | null {
  const sorted = [...rewards].sort((a, b) => a.cost - b.cost);
  return sorted.find((r) => r.cost > balance) ?? null;
}
