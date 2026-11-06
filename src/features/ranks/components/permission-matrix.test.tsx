import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Permission } from "@/generated/prisma/enums";
import { PermissionMatrix } from "./permission-matrix";

describe("PermissionMatrix", () => {
  it("setzt beim Verwalten-Recht das passende Ansehen mit", () => {
    const onChange = vi.fn();
    render(
      <PermissionMatrix
        value={[] as Permission[]}
        onChange={onChange}
        grantable={Object.values(Permission) as Permission[]}
      />,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Ressourcen: Verwalten" }));

    const call = onChange.mock.calls[0];
    expect(new Set(call?.[0] ?? [])).toEqual(new Set(["RESOURCES_MANAGE", "RESOURCES_VIEW"]));
  });

  it("graut Rechte aus, die man selbst nicht hat", () => {
    const onChange = vi.fn();
    render(
      <PermissionMatrix
        value={["RESOURCES_VIEW"] as Permission[]}
        onChange={onChange}
        grantable={["RESOURCES_VIEW", "RESOURCES_MANAGE"] as Permission[]}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Kunden: Ansehen" });
    // Base UI markiert das Checkbox-Element über aria-disabled (es ist kein natives
    // Form-Control), darum hier das zugängliche Signal prüfen.
    expect(checkbox).toHaveAttribute("aria-disabled", "true");
    expect(checkbox.closest("label")).toHaveAttribute("title", "Dieses Recht hast du selbst nicht.");

    // Ein Recht, das man selbst hat, ist wählbar.
    expect(screen.getByRole("checkbox", { name: "Ressourcen: Ansehen" })).not.toHaveAttribute("aria-disabled");
  });
});
