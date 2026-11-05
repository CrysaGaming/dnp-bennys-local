import { expect, test } from "@playwright/test";

/** Smoke-Test: Server läuft und die DB ist erreichbar. */
test("health", async ({ request }) => {
  // `maxRedirects: 0` – sonst würde ein Redirect auf /login als 200 gezählt.
  const res = await request.get("/api/health", { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.db).toBe("ok");
});
