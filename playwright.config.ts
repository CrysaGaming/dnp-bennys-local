import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: [["list"]],
  globalSetup: "tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3100",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: 'node scripts/with-test-db.mjs "npm run build && node scripts/e2e-server.mjs"',
    url: "http://localhost:3100/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT: "3100",
      BETTER_AUTH_URL: "http://localhost:3100",
      SEED_ADMIN_USERNAME: "admin",
      SEED_ADMIN_PASSWORD: "Start-Passwort-123",
      SEED_RADIO_CHANNEL: "1234",
      SEED_RADIO_PASSWORD: "0000",
      UPLOAD_DIR: "./tmp/uploads-e2e",
    },
  },
});
