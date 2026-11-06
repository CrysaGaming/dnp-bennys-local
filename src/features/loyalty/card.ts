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
