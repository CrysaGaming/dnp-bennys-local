"use server";

import { runAction, type ActionResult } from "@/lib/action";
import { updateCompanySettings, type CompanySettings } from "./service";

/** Dünne Action: Session holen, Fachfunktion rufen, Layout revalidieren (Spec 3.2). */
export async function updateCompanySettingsAction(
  input: unknown,
): Promise<ActionResult<CompanySettings>> {
  return runAction((ctx) => updateCompanySettings(ctx, input), {
    // Logo, Firmenname und Status sitzen im Layout und im Header.
    revalidate: [["/", "layout"]],
  });
}
