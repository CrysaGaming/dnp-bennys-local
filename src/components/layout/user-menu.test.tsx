import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MusicProvider } from "@/components/music/music-provider";
import { UserMenu } from "./user-menu";

const signOut = vi.fn();
const replace = vi.fn();

vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: (...args: unknown[]) => signOut(...args) } }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function renderMenu() {
  // Das Menü enthält den Logout-Button, und der stoppt die Musik – dafür braucht er den Provider.
  render(
    <MusicProvider>
      <UserMenu name="Max Power" rankName="Admin" rankColor="#FF2E88" image={null} />
    </MusicProvider>,
  );
}

describe("UserMenu", () => {
  beforeEach(() => {
    signOut.mockClear();
    replace.mockClear();
  });

  it("zeigt Name und Rang", () => {
    renderMenu();

    expect(screen.getByText("Max Power")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("zeigt Profil, Settings und Logout", async () => {
    renderMenu();

    fireEvent.click(screen.getByRole("button", { name: /Max Power/ }));

    const profil = await screen.findByRole("menuitem", { name: "Mein Profil" });
    expect(profil).toHaveAttribute("href", "/profil");
    expect(screen.getByRole("menuitem", { name: "Meine Settings" })).toHaveAttribute("href", "/settings");

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => expect(signOut).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/login");
  });
});
