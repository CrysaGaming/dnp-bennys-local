import { prisma } from "@/lib/prisma";
import type { CompanyStatusMode } from "@/generated/prisma/enums";
import { getCompanySettings } from "@/features/company/service";

export type CompanyStatus = {
  isOpen: boolean;
  mode: CompanyStatusMode;
  onDutyCount: number;
};

/**
 * Reiner Rechner (Spec 5.10): MANUAL entscheidet den Schalter, AUTO die Zahl der
 * offenen Stempel. `manualOpen` ist bei AUTO wirkungslos.
 */
export function computeIsOpen(
  s: { statusMode: CompanyStatusMode; manualOpen: boolean; minOnDuty: number },
  onDutyCount: number,
): boolean {
  if (s.statusMode === "MANUAL") return s.manualOpen;
  return onDutyCount >= s.minOnDuty;
}

/** Für den Header und `/api/status`: offen, wenn genug aktive Mitarbeiter gestempelt haben. */
export async function getCompanyStatus(): Promise<CompanyStatus> {
  const settings = await getCompanySettings();
  const onDutyCount = await prisma.timeEntry.count({
    where: { clockOut: null, employee: { status: "ACTIVE" } },
  });

  return {
    isOpen: computeIsOpen(settings, onDutyCount),
    mode: settings.statusMode,
    onDutyCount,
  };
}
