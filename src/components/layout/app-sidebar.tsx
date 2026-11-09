import type { ReactNode } from "react";
import { Sidebar, SidebarFooter } from "@/components/ui/sidebar";
import { SidebarNav, type SidebarNavGroup } from "./sidebar-nav";
import type { NavGroup } from "./nav-config";

/**
 * Sidebar (Spec 5.3): einklappbar (Icon-Modus, Ctrl/Cmd + B), Zustand im Cookie,
 * auf dem Handy ein Sheet. Logo und Firmenname stehen im Header (Spec 5.2), nicht hier.
 * `footer` bekommt Phase 5 die Stempel-Karte.
 *
 * Die Icons werden hier zu Elementen – Funktionen dürfen nicht an ein
 * Client-Component übergeben werden, deshalb ist der Navigationsteil ausgelagert.
 */
export function AppSidebar({
  groups,
  footer,
}: {
  groups: NavGroup[];
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
      <SidebarNav groups={navGroups} />

      {footer && (
        // Die Stempel-Karte absetzen: Linie und Luft, damit sie nicht mit der Navigation verschmilzt.
        <SidebarFooter className="border-t border-sidebar-border/70 px-3 py-3">{footer}</SidebarFooter>
      )}
    </Sidebar>
  );
}
