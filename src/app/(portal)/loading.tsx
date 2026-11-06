import { Skeleton } from "@/components/ui/skeleton";

/** Ladezustand der Portal-Seiten (Spec 5.4). */
export default function PortalLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
