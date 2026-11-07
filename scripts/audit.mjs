import { readFileSync } from "node:fs";
import lighthouse from "lighthouse";
import CDP from "chrome-remote-interface";
import { chromium } from "@playwright/test";
import { formatScores, reportLine } from "../src/lib/lighthouse-report.ts";

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3100";
const STATE = "tests/e2e/.auth/admin.json";
const PATHS = ["/login", "/dashboard"];

// Der Server muss laufen – im Testlauf startet ihn Playwright, hier wird er von Hand gestartet.
async function alive() {
  try {
    const res = await fetch(`${BASE}/login`);
    return res.ok;
  } catch {
    return false;
  }
}

if (!(await alive())) {
  console.error(`Server auf ${BASE} läuft nicht. Erst: node scripts/e2e-server.mjs`);
  process.exit(1);
}

const browser = await chromium.launch({
  headless: true,
  args: ["--remote-debugging-port=9222"],
});

const state = JSON.parse(readFileSync(STATE, "utf8"));
const client = await CDP({ port: 9222 });

// Cookies gehören in den Browser, nicht in einen Playwright-Kontext – sonst sieht Lighthouse beim
// ersten Request keine Session und die Route leitet auf /login um.
await client.Network.setCookies(state.cookies.map((c) => ({ name: c.name, value: c.value, path: "/", domain: c.domain || "localhost" })));

const lines = [];

for (const path of PATHS) {
  const result = await lighthouse(`${BASE}${path}`, {
    port: 9222,
    output: "json",
    onlyCategories: ["performance", "accessibility"],
    formFactor: "mobile",
    screenEmulation: { mobile: true, width: 412, height: 812, deviceScaleFactor: 1, disabled: false },
    throttlingMethod: "provided",
  });

  if (!result) {
    lines.push({ url: `${BASE}${path}`, redirected: false, performance: null, accessibility: null });
    continue;
  }

  lines.push(reportLine(result.lighthouse));
}

console.log(formatScores(lines));

await client.close();
await browser.close();
