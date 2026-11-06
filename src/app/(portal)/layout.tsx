import { Suspense } from "react";
import { requireSession } from "@/lib/dal";
import { getCompanySettings } from "@/features/company/service";
import { getCompanyStatus } from "@/lib/company-status";
import { getMusicPreference } from "@/features/account/service";
import { getOpenEntry } from "@/features/time/service";
import { ClockCard } from "@/features/time/components/clock-card";
import { MusicAutoResume } from "@/components/music/music-auto-resume";
import { MusicToggle } from "@/components/layout/music-toggle";
import { NAV_GROUPS, visibleNav } from "@/components/layout/nav-config";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppFooter } from "@/components/layout/app-footer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Shell der Portalrouten: Sidebar, Header, Content, Footer. Alles, was den Session-Leser
 * braucht, hängt in einer Suspense-Grenze – ohne Grenze verbietet `cacheComponents` das
 * Lesen von Runtime-Daten bei einer Navigation.
 */
async function Shell({ children }: { children: React.ReactNode }) {
  const ctx = await requireSession({ allowMustChangePassword: true });
  const settings = await getCompanySettings();
  const status = await getCompanyStatus();
  const music = await getMusicPreference(ctx);
  const openEntry = await getOpenEntry(ctx);

  return (
    <SidebarProvider>
      <AppSidebar
        groups={visibleNav(NAV_GROUPS, ctx)}
        companyName={settings.name}
        footer={<ClockCard openSince={openEntry?.clockIn ?? null} />}
      />

      <SidebarInset className="min-h-dvh">
        <AppHeader
          ctx={ctx}
          settings={settings}
          status={status}
          actions={
            <>
              <MusicToggle initial={music} />
              <MusicAutoResume initial={music} />
            </>
          }
        />

        <div className="w-full max-w-screen-2xl px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>

        <AppFooter companyName={settings.name} />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-shell flex min-h-dvh">
      <Suspense fallback={<div className="h-dvh w-16 border-r" />}>
        <Shell>{children}</Shell>
      </Suspense>
    </div>
  );
}
