import { expect, test } from "@playwright/test";

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
