import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "./theme-toggle";

const setTheme = vi.fn();
let theme = "dark";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme, resolvedTheme: theme, setTheme }),
}));

function stubViewTransition() {
  const start = vi.fn((cb: () => void) => cb());
  Object.defineProperty(document, "startViewTransition", { value: start, configurable: true });
  return start;
}

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) => ({ matches, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition;
    setTheme.mockClear();
    theme = "dark";
    document.documentElement.removeAttribute("data-reduced-motion");
    document.documentElement.style.removeProperty("--vt-x");
    document.documentElement.style.removeProperty("--vt-y");
  });

  it("wechselt von dunkel nach hell", () => {
    stubMatchMedia(false);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Zu hellem Design wechseln" }));

    expect(setTheme).toHaveBeenCalledWith("light");
  });

  it("wechselt von hell nach dunkel", () => {
    theme = "light";
    stubMatchMedia(false);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Zu dunklem Design wechseln" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("fährt den Kreis-Übergang vom Button aus", () => {
    stubMatchMedia(false);
    const start = stubViewTransition();
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Zu hellem Design wechseln" }));

    expect(start).toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--vt-x")).toMatch(/px$/);
    expect(document.documentElement.style.getPropertyValue("--vt-y")).toMatch(/px$/);
  });

  it("bleibt bei reduzierter Bewegung beim einfachen Wechsel", () => {
    stubMatchMedia(true);
    const start = stubViewTransition();
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "Zu hellem Design wechseln" }));

    expect(start).not.toHaveBeenCalled();
    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
