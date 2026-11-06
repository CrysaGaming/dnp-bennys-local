import { describe, expect, it } from "vitest";
import { scopeSvgIds } from "./scope-svg-ids";

describe("scopeSvgIds", () => {
  it("scoped Definitionen und Verweise", () => {
    expect(
      scopeSvgIds('<linearGradient id="g1"/><path fill="url(#g1)"/>', "x"),
    ).toBe('<linearGradient id="x-g1"/><path fill="url(#x-g1)"/>');
  });

  it("scoped auch Filter, Masks und xlink:href", () => {
    expect(
      scopeSvgIds('<filter id="glow"/><use xlink:href="#glow"/><g mask="url(#m1)"/><path d="M0 0"/>', "p2"),
    ).toBe('<filter id="p2-glow"/><use xlink:href="#p2-glow"/><g mask="url(#p2-m1)"/><path d="M0 0"/>');
  });

  it("lässt Fremd-IDs (http-URLs) in Ruhe", () => {
    expect(scopeSvgIds('<path fill="url(https://example.com/a.svg#g1)"/>', "x")).toBe(
      '<path fill="url(https://example.com/a.svg#g1)"/>',
    );
  });
});
