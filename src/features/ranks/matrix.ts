import { PERMISSION_META, togglePermission, type PermissionGroup } from "@/lib/permissions";
import type { Permission } from "@/generated/prisma/enums";

/** Gruppen und Reihenfolge wie die Tabelle in Spec 5.9. */
export const PERMISSION_GROUPS: { group: PermissionGroup; permissions: Permission[] }[] = [
  { group: "Kunden", permissions: ["CUSTOMERS_VIEW", "CUSTOMERS_EDIT", "LOYALTY_MANAGE"] },
  { group: "Ressourcen", permissions: ["RESOURCES_VIEW", "RESOURCES_MANAGE"] },
  { group: "Aufträge", permissions: ["ORDERS_VIEW", "ORDERS_CREATE", "ORDERS_MANAGE"] },
  { group: "Rechnungen", permissions: ["INVOICES_MANAGE"] },
  { group: "Lager", permissions: ["INVENTORY_VIEW", "INVENTORY_MANAGE"] },
  { group: "Preisliste", permissions: ["PRICELIST_MANAGE"] },
  { group: "Mitarbeiter", permissions: ["EMPLOYEES_VIEW", "EMPLOYEES_MANAGE"] },
  { group: "Ränge", permissions: ["RANKS_MANAGE"] },
  { group: "Dienstzeiten", permissions: ["TIMES_VIEW_ALL", "TIMES_MANAGE"] },
  { group: "Verwaltung", permissions: ["COMPANY_MANAGE", "AUDIT_VIEW"] },
];

/** Vorgabenfarben (Spec 5.9): Brand-Töne plus neutrale. */
export const RANK_COLOR_PRESETS = [
  "#FF2E88",
  "#FF8A3D",
  "#7C3AED",
  "#22D3EE",
  "#22C55E",
  "#EAB308",
  "#A1A1AA",
  "#F4F4F5",
];

export type GroupState = "all" | "some" | "none";

export function groupState(selected: Permission[], perms: Permission[]): GroupState {
  const hit = perms.filter((p) => selected.includes(p)).length;

  if (hit === 0) return "none";
  if (hit === perms.length) return "all";
  return "some";
}

/** Gruppen-Checkbox: alle an oder ab. Abmelden nimmt auch die davon abhängigen Rechte. */
export function toggleGroup(selected: Permission[], perms: Permission[], checked: boolean): Permission[] {
  let result = [...selected];

  for (const p of perms) {
    result = togglePermission(result, p, checked);
  }

  return result;
}

export function labelOf(p: Permission): string {
  return PERMISSION_META[p].label;
}
