"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { MotionPreference } from "./motion-preference";

/**
 * Shell-Provider (Spec 5.1): Theme mit System-Vorgabe und Standard „dunkel“,
 * Toasts unten rechts. Die Werte kommen aus der Einstellungszeile des Nutzers
 * (Spec 5.12) – ohne Session bleibt es bei der Standardvorgabe.
 */
export function Providers({
  children,
  initialTheme,
  reducedMotion,
}: {
  children: React.ReactNode;
  initialTheme?: string;
  reducedMotion?: boolean;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme={initialTheme ?? "dark"} enableSystem>
      <MotionPreference reduced={reducedMotion ?? false}>{children}</MotionPreference>
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
}
