import { Suspense } from "react";
import { requirePagePermission } from "@/lib/dal";
import { withImplied } from "@/lib/permissions";
import { listRanks } from "@/features/ranks/service";
import { RankList } from "@/features/ranks/components/rank-list";

async function Content() {
  const ctx = await requirePagePermission("RANKS_MANAGE");
  const ranks = await listRanks(ctx);

  // Was der Bearbeiter selbst hat, darf er vergeben (Spec 5.9) – die Liste zeigt den
  // eigenen Kontext, die Fachfunktion prüft dasselbe noch einmal.
  const grantable = withImplied(ctx.permissions);

  return (
    <Suspense fallback={<div>Wird geladen…</div>}>
      <RankList ranks={ranks} grantable={grantable} />
    </Suspense>
  );
}

export default function RängePage() {
  return <Content />;
}
