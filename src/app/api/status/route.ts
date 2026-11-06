import { getSessionContext } from "@/lib/dal";
import { getCompanyStatus } from "@/lib/company-status";

/* `dynamic` ist mit `cacheComponents` nicht kombinierbar – der Status muss immer frisch sein. */
export const cache = "no-store" as const;

/**
 * Firmenstatus für das Polling im Header (Spec 5.10). Der Proxy ist keine
 * Sicherheitsgrenze – die Route prüft die Session selbst.
 */
export async function GET(req: Request) {
  const ctx = await getSessionContext(req.headers);
  if (!ctx) {
    return Response.json({ error: "Ohne Session gibt es keinen Firmenstatus." }, { status: 401 });
  }

  return Response.json(await getCompanyStatus());
}
