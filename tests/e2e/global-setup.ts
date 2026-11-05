import { mkdirSync, writeFileSync } from "node:fs";

/**
 * Phase 1 loggt hier einen Admin ein und schreibt die Session.
 * Für Phase 0 reicht ein leerer State, damit die Config lauffähig ist.
 */
export default async function globalSetup(): Promise<void> {
  mkdirSync("tests/e2e/.auth", { recursive: true });
  writeFileSync(
    "tests/e2e/.auth/admin.json",
    JSON.stringify({ cookies: [], origins: [] }, null, 2),
  );
}
