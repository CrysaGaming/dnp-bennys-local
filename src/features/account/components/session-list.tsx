"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { authClient } from "@/lib/auth-client";

type SessionInfo = {
  id: string;
  createdAt: string | Date;
  expiresAt: string | Date;
  userAgent?: string | null;
  ipAddress?: string | null;
};

/**
 * Aktive Sessions (Spec 5.12). Der aktuelle Rechner ist markiert, „Überall abmelden“
 * wirft alle anderen raus – das ist der Notausgang, wenn ein Gerät verloren geht.
 */
export function SessionList() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    return Promise.all([authClient.listSessions(), authClient.getSession()]).then(([list, current]) => {
      if (list.error) {
        toast.error("Sessions konnten nicht geladen werden.");
        return;
      }

      setSessions(list.data ?? []);
      setCurrentId(current.data?.session?.id ?? null);
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function revokeAll() {
    setBusy(true);

    const res = await authClient.revokeOtherSessions();

    if (res.error) {
      toast.error("Abmelden fehlgeschlagen.");
      setBusy(false);
      return;
    }

    toast("Alle anderen Sessions sind abgemeldet.");
    setBusy(false);
    await load();
  }

  return (
    <div className="flex flex-col gap-3">
      {sessions.length === 0 ? <p className="text-sm text-muted-foreground">Keine Sessions.</p> : null}

      <ul className="flex flex-col gap-2">
        {sessions.map((session) => (
          <li key={session.id} className="flex items-center justify-between gap-3 text-sm">
            <span>
              {session.userAgent ?? "Unbekanntes Gerät"}
              <span className="block text-xs text-muted-foreground">
                {formatDateTime(new Date(session.createdAt))}
                {session.id === currentId ? " · dieses Gerät" : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <Button type="button" variant="outline" disabled={busy} onClick={revokeAll}>
        Überall abmelden
      </Button>
    </div>
  );
}
