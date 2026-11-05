import { prisma } from "@/lib/prisma";

/* `dynamic` ist mit `cacheComponents` nicht kombinierbar – die Prüfung muss immer frisch sein. */
export const cache = "no-store" as const;

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "ok" });
  } catch {
    return Response.json({ status: "error", db: "down" }, { status: 503 });
  }
}
