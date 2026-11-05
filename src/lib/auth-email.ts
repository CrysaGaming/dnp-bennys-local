/**
 * Mitarbeiter haben keine echte E-Mail. Better Auth verlangt aber eine pro User,
 * deshalb die interne Adresse aus dem Benutzernamen – sie wird nirgends angezeigt (Spec 3.2).
 */
export function internalEmail(username: string): string {
  return `${username.trim().toLowerCase()}@bennys.local`;
}
