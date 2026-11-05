import "dotenv/config";
import { beforeEach } from "vitest";
import { resetDb } from "@tests/helpers/db";

if (!process.env.DATABASE_URL && process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

beforeEach(async () => {
  await resetDb();
});
