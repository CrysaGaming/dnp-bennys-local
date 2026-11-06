"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "cn";
import type { Permission } from "@/generated/prisma/enums";
import { groupState, labelOf, PERMISSION_GROUPS, toggleGroup } from "../matrix";
import { togglePermission } from "@/lib/permissions";

export const NOT_GRANTABLE_HINT = "Dieses Recht hast du selbst nicht.";

/**
 * Rechte-Checkboxen, gruppiert nach Bereich (Spec 5.9). Die Gruppen-Checkbox zeigt
 * „teilweise“ (indeterminate). Rechte, die der Bearbeiter selbst nicht hat, sind
 * ausgegraut – der Hinweis steht als `title` am Label, weil ein ausgegranntes Feld
 * keine Zeigerereignisse bekommt und ein Radix-Tooltip sich dann nicht öffnet.
 */
export function PermissionMatrix({
  value,
  onChange,
  grantable,
}: {
  value: Permission[];
  onChange: (permissions: Permission[]) => void;
  grantable: Permission[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {PERMISSION_GROUPS.map(({ group, permissions }) => {
        const state = groupState(value, permissions);

        return (
          <div key={group} className="flex flex-wrap items-center gap-3">
            <label className={cn("flex items-center gap-2 font-medium")}>
              <Checkbox
                aria-label={group}
                checked={state === "all"}
                indeterminate={state === "some"}
                onCheckedChange={(checked) => onChange(toggleGroup(value, permissions, Boolean(checked)))}
              />
              <span>{group}</span>
            </label>

            {permissions.map((p) => {
              const can = grantable.includes(p);

              return (
                <label
                  key={p}
                  className={cn("flex items-center gap-2 text-sm", !can && "opacity-60")}
                  title={can ? undefined : NOT_GRANTABLE_HINT}
                >
                  <Checkbox
                    aria-label={`${group}: ${labelOf(p)}`}
                    checked={value.includes(p)}
                    disabled={!can}
                    onCheckedChange={(checked) => onChange(togglePermission(value, p, Boolean(checked)))}
                  />
                  <span>{labelOf(p)}</span>
                </label>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
