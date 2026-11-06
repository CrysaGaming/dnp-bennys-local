import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import PortalTemplate from "./template";

/**
 * Der Seitenwechsel darf kein React-Style computing: mit motion schrieb der Server
 * `translateY(4px)`, der Client renderte schon `none` – das ist die gemeldete
 * Hydration-Differenz. Ein reines CSS-Animation-Element ist auf beiden Seiten gleich.
 */
describe("PortalTemplate", () => {
  it("rendert einen einfachen Container ohne React-Style", () => {
    const { container } = render(<PortalTemplate><p>Test</p></PortalTemplate>);

    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.className).toBe("page-enter");
    expect(wrapper.getAttribute("style")).toBeNull();
  });
});
