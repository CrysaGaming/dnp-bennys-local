import { expect, test } from "@playwright/test";

const STORAGE_STATE = "tests/e2e/.auth/admin.json";

test.describe("Firmenstatus", () => {
  test.use({ storageState: STORAGE_STATE });

  test("API antwortet mit Session", async ({ request }) => {
    const res = await request.get("/api/status");

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ mode: "AUTO", isOpen: false, onDutyCount: 0 });
  });
});

test("ungültiges Cookie läuft durch den Proxy, aber die Route gibt 401", async ({ context }) => {
  // Review Focus 2: der Proxy ist nur optisch – die Route prüft selbst.
  await context.addCookies([
    { name: "better-auth.session_token", value: "ungueltig", url: "http://localhost:3100" },
  ]);

  const res = await context.request.get("/api/status");
  expect(res.status()).toBe(401);
});
