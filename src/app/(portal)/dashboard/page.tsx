import { Suspense } from "react";
import { requireSession } from "@/lib/dal";

async function Content() {
  const ctx = await requireSession();
  return <p>{ctx.name}</p>;
}

export default function DashboardPage() {
  return <Suspense fallback={<div>Wird geladen…</div>}><Content /></Suspense>;
}
