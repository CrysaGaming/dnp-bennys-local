import { auth } from "@/lib/auth";

/**
 * Echtes Login und daraus ein Cookie-Header für `getSessionContext`.
 * So testen wir den Weg, den der Proxy im Browser tatsächlich geht.
 */
export async function signInHeaders(username: string, password: string): Promise<Headers> {
  const res = await auth.api.signInUsername({
    body: { username, password },
    returnHeaders: true,
  });

  if (!res) throw new Error("Anmeldung fehlgeschlagen");

  const setCookie = res.headers?.get("set-cookie");
  if (!setCookie) throw new Error("Kein Session-Cookie erhalten");

  const pair = setCookie.split(";")[0];
  if (!pair) throw new Error("Set-Cookie ohne Wert");

  const h = new Headers();
  h.set("cookie", pair);
  return h;
}
