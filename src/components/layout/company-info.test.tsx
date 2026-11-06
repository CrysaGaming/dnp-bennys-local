import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CompanyInfo } from "./company-info";

describe("CompanyInfo", () => {
  it("zeigt den Hinweis, wenn keine Rufnummer hinterlegt ist", () => {
    render(<CompanyInfo phone={null} radioChannel="1234" radioPassword="0000" />);

    expect(screen.getByText("keine Rufnummer hinterlegt")).toBeInTheDocument();
    expect(screen.getByText("Funk 1234 (0000)")).toBeInTheDocument();
  });

  it("zeigt Nummer und Funk, wenn beides da ist", () => {
    render(<CompanyInfo phone="555-0123" radioChannel="1234" radioPassword="0000" />);

    expect(screen.getByText("555-0123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rufnummer kopieren" })).toBeInTheDocument();
  });

  it("lässt die Klammern weg, wenn das Funk-Passwort fehlt", () => {
    render(<CompanyInfo phone="555-0123" radioChannel="1234" radioPassword={null} />);

    expect(screen.getByText("Funk 1234")).toBeInTheDocument();
  });
});
