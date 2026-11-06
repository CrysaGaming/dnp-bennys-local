import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLogo } from "./brand-logo";

describe("BrandLogo", () => {
  it("ist ein Bild mit dem Firmennamen als Zugriffsnamen", () => {
    render(<BrandLogo variant="VICE_CITY" layout="compact" companyName="Benny's" />);

    const img = screen.getByRole("img", { name: "Benny's" });
    expect(img).toHaveAttribute("data-logo-variant", "VICE_CITY");
    expect(img).toHaveAttribute("data-logo-layout", "compact");
  });

  it("zeigt bei EMBLEM den Firmennamen als Text", () => {
    render(<BrandLogo variant="EMBLEM" layout="compact" companyName="Benny's" />);

    expect(screen.getByText("Benny's")).toBeInTheDocument();
  });

  it("zeigt dunkle und helle Version", () => {
    render(<BrandLogo variant="LOS_SANTOS" layout="full" companyName="Benny's" />);

    const themes = document.querySelectorAll("[data-logo-theme]");
    expect(themes).toHaveLength(2);
    expect(themes[0]).toHaveAttribute("data-logo-theme", "dark");
    expect(themes[1]).toHaveAttribute("data-logo-theme", "light");
  });

  it("hat keine doppelten IDs, wenn mehrere Logos auf einer Seite sind", () => {
    render(
      <div>
        <BrandLogo variant="VICE_CITY" layout="compact" companyName="Benny's" />
        <BrandLogo variant="VICE_CITY" layout="full" companyName="Benny's" />
        <BrandLogo variant="EMBLEM" layout="compact" companyName="Benny's" />
      </div>,
    );

    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id);
    expect(ids.length).toBeGreaterThan(4);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
