import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RevenueChart } from "./revenue-chart";

const days = [
  { label: "01.11.", revenue: 0 },
  { label: "02.11.", revenue: 12500 },
];

describe("RevenueChart", () => {
  it("hat eine Rolle, damit der aria-label wirksam ist", () => {
    render(<RevenueChart days={days} />);

    const chart = screen.getByRole("img", { name: "Umsatz der letzten sieben Tage" });

    expect(chart).toBeInTheDocument();
  });
});
