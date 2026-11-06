/**
 * Startpasswort für neue Mitarbeiter (Spec 3.5). Es wird nur einmal angezeigt, danach
 * muss der Mitarbeiter es ändern. Die Zeichengruppe ist vorlesbar: kein 0, O, 1, I, L.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const LENGTH = 14;

export function generateStartPassword(length: number = LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length] ?? ALPHABET[0]).join("");
}
