import type { Permission } from "@/generated/prisma/enums";
import type { SessionContext } from "./session-types";
import { ForbiddenError } from "./errors";

/** Gruppen wie in Spec 5.9 (Ränge-Creator). */
export type PermissionGroup =
  | "Kunden"
  | "Ressourcen"
  | "Aufträge"
  | "Rechnungen"
  | "Lager"
  | "Preisliste"
  | "Mitarbeiter"
  | "Ränge"
  | "Dienstzeiten"
  | "Verwaltung";

export type PermissionMeta = {
  label: string;
  group: PermissionGroup;
  /** Rechte, die automatisch mitgesetzt werden (Spec 5.9). */
  implies: Permission[];
};

export const PERMISSION_META: Record<Permission, PermissionMeta> = {
  CUSTOMERS_VIEW: { label: "Ansehen", group: "Kunden", implies: [] },
  CUSTOMERS_EDIT: { label: "Anlegen/Bearbeiten", group: "Kunden", implies: ["CUSTOMERS_VIEW"] },
  LOYALTY_MANAGE: { label: "Treue verwalten", group: "Kunden", implies: ["CUSTOMERS_VIEW"] },
  RESOURCES_VIEW: { label: "Ansehen", group: "Ressourcen", implies: [] },
  RESOURCES_MANAGE: { label: "Verwalten", group: "Ressourcen", implies: ["RESOURCES_VIEW"] },
  ORDERS_VIEW: { label: "Ansehen", group: "Aufträge", implies: [] },
  ORDERS_CREATE: { label: "Anlegen", group: "Aufträge", implies: ["ORDERS_VIEW"] },
  ORDERS_MANAGE: { label: "Fremde Aufträge verwalten", group: "Aufträge", implies: ["ORDERS_VIEW"] },
  INVOICES_MANAGE: { label: "Verwalten", group: "Rechnungen", implies: ["ORDERS_VIEW"] },
  INVENTORY_VIEW: { label: "Ansehen", group: "Lager", implies: [] },
  INVENTORY_MANAGE: { label: "Verwalten", group: "Lager", implies: ["INVENTORY_VIEW"] },
  PRICELIST_MANAGE: { label: "Verwalten", group: "Preisliste", implies: [] },
  EMPLOYEES_VIEW: { label: "Ansehen", group: "Mitarbeiter", implies: [] },
  EMPLOYEES_MANAGE: { label: "Verwalten", group: "Mitarbeiter", implies: ["EMPLOYEES_VIEW"] },
  RANKS_MANAGE: { label: "Verwalten", group: "Ränge", implies: [] },
  TIMES_VIEW_ALL: { label: "Alle ansehen", group: "Dienstzeiten", implies: [] },
  TIMES_MANAGE: { label: "Korrigieren", group: "Dienstzeiten", implies: ["TIMES_VIEW_ALL"] },
  COMPANY_MANAGE: { label: "Firmeneinstellungen", group: "Verwaltung", implies: [] },
  AUDIT_VIEW: { label: "Audit-Log ansehen", group: "Verwaltung", implies: [] },
};

/** Rechte plus aller Implikationen (transitiv). */
export function withImplied(perms: Permission[]): Permission[] {
  const result = new Set<Permission>();
  const visit = (p: Permission) => {
    if (result.has(p)) return;
    result.add(p);
    for (const implied of PERMISSION_META[p].implies) visit(implied);
  };
  for (const p of perms) visit(p);
  return [...result];
}

/** Checkbox anklicken/abmelden – abmelden entfernt auch die davon abhängigen Rechte. */
export function togglePermission(
  selected: Permission[],
  p: Permission,
  checked: boolean,
): Permission[] {
  if (checked) return withImplied([...selected, p]);

  const removed = new Set<Permission>([p]);
  const dependents = (candidate: Permission) => PERMISSION_META[candidate].implies.includes(p);
  for (const s of selected) {
    if (dependents(s)) removed.add(s);
  }
  return selected.filter((s) => !removed.has(s));
}

export function hasPermission(
  ctx: Pick<SessionContext, "isAdmin" | "permissions">,
  p: Permission,
): boolean {
  if (ctx.isAdmin) return true;
  return withImplied(ctx.permissions).includes(p);
}

export function assertPermission(
  ctx: Pick<SessionContext, "isAdmin" | "permissions">,
  p: Permission,
): void {
  if (!hasPermission(ctx, p)) throw new ForbiddenError();
}

/** Nur Ränge unter dem eigenen Level verwalten (Spec 5.9 / AGENTS.md). */
export function outranks(
  ctx: Pick<SessionContext, "isAdmin" | "rank">,
  targetLevel: number,
): boolean {
  if (ctx.isAdmin) return true;
  return ctx.rank.level > targetLevel;
}
