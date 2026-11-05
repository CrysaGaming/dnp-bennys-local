import { spawn } from "node:child_process";
import { config as loadEnv } from "dotenv";

loadEnv();

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;

const command = process.argv.slice(2).join(" ");

if (!command) {
  console.error("Usage: node scripts/with-test-db.mjs <command>");
  process.exit(1);
}

const child = spawn(command, { shell: true, stdio: "inherit", env: process.env });

child.on("exit", (code) => process.exit(code ?? 1));
