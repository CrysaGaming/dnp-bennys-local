import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Sidebar, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { SidebarNav, type SidebarNavGroup } from "./sidebar-nav";
import type { NavGroup } from "./nav-config";

/**
 * Sidebar (Spec 5.3): einklappbar (Icon-Modus, Ctrl/Cmd + B), Zustand im Cookie,
 * auf dem Handy ein Sheet. `footer` bekommt Phase 5 die Stempel-Karte.
 *
 * Die Icons werden hier zu Elementen – Funktionen dürfen nicht an ein
 * Client-Component übergeben werden, deshalb ist der Navigationsteil ausgelagert.
 */
export function AppSidebar({
  groups,
  companyName,
  footer,
}: {
  groups: NavGroup[];
  companyName: string;
  footer?: ReactNode;
}) {
  const navGroups: SidebarNavGroup[] = groups.map((group) => ({
    title: group.title,
    items: group.items.map((item) => ({
      title: item.title,
      href: item.href,
      icon: <item.icon aria-hidden />,
    })),
  }));

  return (
    <Sidebar
      collapsible="icon"
      // shadcn setzt den Sidebar-Container auf den ganzen Viewport (fixed inset-y-0).
      // Der Header läuft jetzt über die volle Breite, also beginnt die Sidebar darunter.
      // Inline, weil die Utility-Klassen für inset-y und Höhe gegeneinander arbeiten.
      style={{
        top: "var(--header-height)",
        height: "calc(100svh - var(--header-height))",
      }}
    >
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrandLogo variant="EMBLEM" layout="compact" companyName={companyName} className="h-8" />
        </Link>
      </SidebarHeader>

      <SidebarNav groups={navGroups} />

      {footer && <SidebarFooter>{footer}</SidebarFooter>}
    </Sidebar>
  );
}
