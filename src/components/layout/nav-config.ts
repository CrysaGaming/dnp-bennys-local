import {
  Boxes,
  Building2,
  ClipboardList,
  Clock,
  Contact,
  Gift,
  LayoutDashboard,
  Package,
  Receipt,
  Shield,
  SlidersHorizontal,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/generated/prisma/enums";
import type { SessionContext } from "@/lib/session-types";

/** Ein Eintrag der Sidebarnavigation (Spec 5.3). */
export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Ohne Recht ist der Eintrag für alle sichtbar. */
  permission?: Permission;
};

export type NavGroup = { title: string; items: NavItem[] };

/** Gruppen in der Reihenfolge der Spec 5.3. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Übersicht",
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Kunden",
    items: [
      { title: "Kundenkartei", href: "/kunden", icon: Contact, permission: "CUSTOMERS_VIEW" },
      { title: "Treueprämien", href: "/kunden/praemien", icon: Gift },
      { title: "Treue-Einstellungen", href: "/kunden/treue-einstellungen", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Betrieb",
    items: [
      { title: "Aufträge", href: "/auftraege", icon: ClipboardList, permission: "ORDERS_VIEW" },
      { title: "Rechnungen", href: "/rechnungen", icon: Receipt, permission: "INVOICES_MANAGE" },
      { title: "Lager", href: "/lager", icon: Package, permission: "INVENTORY_VIEW" },
      { title: "Preisliste", href: "/preisliste", icon: Tags },
    ],
  },
  {
    title: "Ressourcen",
    items: [{ title: "Datenbank", href: "/ressourcen", icon: Boxes, permission: "RESOURCES_VIEW" }],
  },
  {
    title: "Team",
    items: [
      { title: "Mitarbeiter", href: "/mitarbeiter", icon: Users, permission: "EMPLOYEES_VIEW" },
      { title: "Ränge", href: "/raenge", icon: Shield, permission: "RANKS_MANAGE" },
      { title: "Dienstzeiten", href: "/dienstzeiten", icon: Clock },
    ],
  },
  {
    title: "Verwaltung",
    items: [{ title: "Firma", href: "/einstellungen/firma", icon: Building2, permission: "COMPANY_MANAGE" }],
  },
];

/** Nur die Gruppen und Einträge, die der Kontext sieht; leere Gruppen fallen raus (Spec 5.3). */
export function visibleNav(
  groups: NavGroup[],
  ctx: Pick<SessionContext, "isAdmin" | "permissions">,
): NavGroup[] {
  return groups
    .map((group) => ({
      title: group.title,
      items: group.items.filter(
        (item) => !item.permission || ctx.isAdmin || ctx.permissions.includes(item.permission),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
