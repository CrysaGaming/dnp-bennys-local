"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Der Proxy und `requirePagePermission` leiten mit `?fehler=berechtigung` hierher um
 * (Spec 3.3). Der Toast kommt einmal, beim Rendern der Seite.
 */
export function PermissionToast({ message }: { message: string }) {
  useEffect(() => {
    toast(message);
  }, [message]);

  return null;
}
