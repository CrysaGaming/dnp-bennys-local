import type { Metadata } from "next";
import { Suspense } from "react";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { optionalSession } from "@/lib/dal";
import { getPreferences } from "@/features/account/service";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Benny's Portal",
  description: "Internes Mitarbeiterportal der RP-Werkstatt Benny's (DNP Roleplay).",
};

/** Theme und Bewegung des Nutzers (Spec 5.12) – die Lesung gehört in die Suspense-Grenze. */
async function Shell({ children }: { children: React.ReactNode }) {
  const ctx = await optionalSession();
  const prefs = ctx ? await getPreferences(ctx) : null;

  return (
    <Providers
      initialTheme={prefs?.theme === "SYSTEM" ? "system" : prefs?.theme.toLowerCase()}
      reducedMotion={prefs?.reducedMotion}
    >
      {children}
    </Providers>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${anton.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <Shell>{children}</Shell>
        </Suspense>
      </body>
    </html>
  );
}
