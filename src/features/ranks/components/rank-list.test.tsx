import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Permission } from "@/generated/prisma/enums";
import { RankList } from "./rank-list";
import type { RankRow } from "../service";

// Die Server Actions ziehen die ganze Service-Kette (Prisma) nach – hier nicht nötig.
vi.mock("../actions", () => ({ deleteRankAction: vi.fn() }));

const mechaniker: RankRow = {
  id: "r-1",
  name: "Mechaniker",
  level: 20,
  color: "#FF8A3D",
  hourlyWage: 900,
  permissions: [Permission.EMPLOYEES_VIEW],
  isSystem: false,
  employeeCount: 1,
};

/**
 * Der Editor öffnet als Modal in der Mitte (Entscheidung vom 2026-11-08, vorher Sheet von
 * rechts). Unterscheidbar über die data-slots der shadcn-Komponenten, weil beide dasselbe
 * `role="dialog"` haben.
 */
describe("RankList – Editor", () => {
  it("öffnet „Neuer Rang“ als Modal statt als Seitensheet", () => {
    render(<RankList ranks={[mechaniker]} grantable={Object.values(Permission) as Permission[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Neuer Rang" }));

    expect(document.querySelector('[data-slot="sheet-content"]')).toBeNull();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Neuer Rang" })).toBeInTheDocument();
  });

  it("schließt das Modal über „Abbrechen“", () => {
    render(<RankList ranks={[mechaniker]} grantable={Object.values(Permission) as Permission[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Neuer Rang" }));
    fireEvent.click(screen.getByRole("button", { name: "Abbrechen" }));

    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();
  });
});
