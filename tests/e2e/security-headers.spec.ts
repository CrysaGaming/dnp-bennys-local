import { expect, test } from "@playwright/test";
import { startScene } from "./helpers/login";

test("Security-Header auf jeder Antwort", async ({ request }) => {
  const res = await request.get("/login");

  const csp = res.headers()["content-security-policy"];

  expect(csp).toContain("default-src 'self'");
  expect(csp).toContain("img-src 'self' data: blob:");
  expect(csp).toContain("media-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain("base-uri 'self'");
  expect(csp).toContain("form-action 'self'");

  expect(res.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
});

test("Zod im Browser ruft keine neue Function – die CSP verbietet sie", async ({ page }) => {
  // Die CSP ist `script-src 'self' 'unsafe-inline'` ohne 'unsafe-eval'. Der DevTools-Reporter
  // zeigt solche Verstöße nur im Issues-Panel, nicht in der Konsole – darum wird hier der
  // Aufruf selbst gezählt.
  await page.addInitScript(() => {
    const real = globalThis.Function;
    let calls = 0;
    const counted = new Proxy(real, {
      apply: (target: FunctionConstructor, self: unknown, args: unknown[]) => {
        calls += 1;
        return Reflect.apply(target, self, args);
      },
      construct: (target: FunctionConstructor, args: unknown[]) => {
        calls += 1;
        return Reflect.construct(target, args);
      },
    }) as unknown as FunctionConstructor;
    globalThis.Function = counted;
    (globalThis as { __functionCalls?: () => number }).__functionCalls = () => calls;
  });

  await page.goto("/login");
  await startScene(page);

  await page.getByRole("textbox", { name: "Benutzername" }).fill("max");
  await page.getByRole("textbox", { name: "Passwort" }).fill("falsch");
  await page.getByRole("button", { name: "Einloggen" }).click();

  // Positiv, bevor gezählt wird: ohne diese Meldung wäre die Count-0-Aussage leer.
  await expect(page.getByText("Benutzername oder Passwort falsch.")).toBeVisible();

  expect(
    await page.evaluate(() => (globalThis as unknown as { __functionCalls: () => number }).__functionCalls()),
  ).toBe(0);
});
