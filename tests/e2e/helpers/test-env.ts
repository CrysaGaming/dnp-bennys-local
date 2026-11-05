import "dotenv/config";

// E2E läuft immer gegen die Test-DB. Muss vor allen Imports stehen, die `@/lib/prisma` lesen.
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
