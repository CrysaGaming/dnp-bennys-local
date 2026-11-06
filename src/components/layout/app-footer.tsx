/** Footer (Spec 5.5): Firmenname links, Version und Zeitzone rechts. */
export function AppFooter({ companyName }: { companyName: string }) {
  const year = new Date().getFullYear();
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0";

  return (
    <footer className="flex h-10 items-center justify-between gap-4 border-t px-4 text-xs text-muted-foreground sm:px-6">
      <span>
        © {year} {companyName} · DNP Roleplay
      </span>
      <span className="font-mono">
        v{version} · Europe/Berlin
      </span>
    </footer>
  );
}
