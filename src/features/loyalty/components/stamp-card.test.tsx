import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StampCard } from "./stamp-card";

describe("StampCard", () => {
  it("sieben gefüllte Felder und der Hinweis auf die nächste Prämie", () => {
    render(
      <StampCard balance={7} cardSize={10} nextReward={{ name: "20 % Rabatt", cost: 10 }} />,
    );

    expect(screen.getAllByText("Noch 3 Stempel bis „20 % Rabatt“")).toHaveLength(1);
    expect(document.querySelectorAll('[data-stamp="filled"]')).toHaveLength(7);
    expect(document.querySelectorAll('[data-stamp="empty"]')).toHaveLength(3);
  });

  it("mehr Stempel als Felder: die volle Karte wird genannt", () => {
    render(<StampCard balance={13} cardSize={10} nextReward={{ name: "20 % Rabatt", cost: 20 }} />);

    expect(screen.getByText("1 volle Karte + 3")).toBeInTheDocument();
  });

  it("ohne Prämie kein Hinweis", () => {
    render(<StampCard balance={2} cardSize={6} nextReward={null} />);

    expect(screen.queryByText(/Noch \d+ Stempel bis/)).not.toBeInTheDocument();
    expect(document.querySelectorAll('[data-stamp="filled"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-stamp="empty"]')).toHaveLength(4);
  });

  it("Reduzierte Bewegung blendet nur ein, die Drehung fällt weg", () => {
    // Reduced Motion steht hier auf dem Element, wie es die Portal-Shell setzt.
    document.documentElement.setAttribute("data-reduced-motion", "true");

    render(<StampCard balance={3} cardSize={6} nextReward={null} />);

    const stamp = document.querySelector('[data-stamp="filled"]') as HTMLElement;
    expect(stamp.style.transform).toBe("");

    document.documentElement.removeAttribute("data-reduced-motion");
  });
});
