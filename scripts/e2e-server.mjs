#!/usr/bin/env node
/**
 * E2E-Server: derselbe Runtime wie im Container (`node .next/standalone/server.js`).
 * `next start` läuft nicht sauber mit `output: "standalone"`. Der Standalone-Output
 * enthält weder `.next/static` noch `public` – beides wird hier hineinkopiert.
 */
import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";

const port = process.env.PORT ?? "3100";

if (!existsSync(".next/standalone/server.js")) {
  console.error("Erst `npm run build`, dann dieses Script.");
  process.exit(1);
}

cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
cpSync("public", ".next/standalone/public", { recursive: true });

const child = spawn("node", [".next/standalone/server.js"], {
  stdio: "inherit",
  env: { ...process.env, PORT: port },
});

child.on("exit", (code) => process.exit(code ?? 1));
