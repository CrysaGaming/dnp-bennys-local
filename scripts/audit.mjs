import lighthouse, { defaultConfig } from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import CDP from "chrome-remote-interface";
import dotenv from "dotenv";
import { formatScores, reportLine } from "../src/lib/lighthouse-report.ts";

dotenv.config();

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3100";

// Zugangsdaten nur aus der Umgebung – nie im Repo.
const USER = process.env.SEED_ADMIN_USERNAME;
const PASS = process.env.SEED_ADMIN_PASSWORD;

async function alive() {
  try {
    return (await fetch(`${BASE}/login`)).ok;
  } catch {
    return false;
  }
}

if (!(await alive())) {
  console.error(`Server auf ${BASE} läuft nicht. Erst: node scripts/e2e-server.mjs`);
  process.exit(1);
}

if (!USER || !PASS) {
  console.error("SEED_ADMIN_USERNAME und SEED_ADMIN_PASSWORD fehlen – ohne Sitzung wird /dashboard umgeleitet.");
  process.exit(1);
}

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--window-size=412,823"] });
const client = await CDP({ port: chrome.port });
await client.Network.enable();

const flags = {
  port: chrome.port,
  output: "json",
  onlyCategories: ["performance", "accessibility"],
  formFactor: "mobile",
};

const lines = [];

try {
  // /login ohne Sitzung. Mit Sitzung leitet die Seite um, und die Zahl stünde für das Dashboard.
  lines.push(reportLine((await lighthouse(`${BASE}/login`, flags, defaultConfig)).lhr));

  // Die Session kommt aus dem echten Login und wird per CDP auf Browserebene gesetzt. Ein
  // Storage-State aus Playwright reicht hier nicht: der Cookie liegt zwar im Jar, aber der
  // Dokument-Request von Lighthouse kommt ohne ihn an (die Seite leitet auf /login um).
  const res = await fetch(`${BASE}/api/auth/sign-in/username`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const raw = res.headers.getSetCookie();
  if (!raw.length) {
    console.error(`Login fehlte (${res.status}) – ohne Sitzung ist /dashboard nicht messbar.`);
    process.exit(1);
  }

  for (const c of raw) {
    const pair = c.split(";")[0];
    const i = pair.indexOf("=");
    await client.Network.setCookie({ name: pair.slice(0, i), value: pair.slice(i + 1), domain: "localhost", path: "/" });
  }

  lines.push(reportLine((await lighthouse(`${BASE}/dashboard`, flags, defaultConfig)).lhr));
  console.log(formatScores(lines));
} finally {
  await client.close();
  await chrome.kill();
}
