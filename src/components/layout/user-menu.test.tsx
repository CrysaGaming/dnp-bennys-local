import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UserMenu } from "./user-menu";

const signOut = vi.fn();
const replace = vi.fn();

vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: (...args: unknown[]) => signOut(...args) } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

describe("UserMenu", () => {
  beforeEach(() => {
    signOut.mockClear();
    replace.mockClear();
  });

  it("zeigt Name und Rang", () => {
    render(<UserMenu name="Max Power" rankName="Admin" rankColor="#FF2E88" image={null} />);

    expect(screen.getByText("Max Power")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("zeigt Profil, Settings und Logout", async () => {
    render(<UserMenu name="Max Power" rankName="Admin" rankColor="#FF2E88" image={null} />);

    fireEvent.click(screen.getByRole("button", { name: /Max Power/ }));

    const profil = await screen.findByRole("menuitem", { name: "Mein Profil" });
    expect(profil).toHaveAttribute("href", "/profil");
    expect(screen.getByRole("menuitem", { name: "Meine Settings" })).toHaveAttribute("href", "/settings");

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
