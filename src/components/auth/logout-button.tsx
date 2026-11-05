"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/** Logout – danach zurück zur Login-Seite (Spec 3.2). */
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await authClient.signOut();
    router.replace("/login");
  }

  return (
    <Button type="button" variant="outline" onClick={logout} disabled={busy}>
      Logout
    </Button>
  );
}
