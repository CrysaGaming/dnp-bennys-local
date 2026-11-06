"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

/** Logout – danach zurück zur Login-Seite (Spec 3.2). */
export function LogoutButton({
  variant = "outline",
  className,
}: {
  variant?: "outline" | "ghost";
  className?: string;
} = {}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await authClient.signOut();
    router.replace("/login");
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={cn("gap-1.5", className)}
      onClick={logout}
      disabled={busy}
    >
      <LogOut aria-hidden className="size-4" />
      Logout
    </Button>
  );
}
