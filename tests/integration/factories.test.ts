import { describe, it, expect } from "vitest";
import { makeCtx } from "@tests/helpers/factories";

describe("makeCtx", () => {
  it("baut den Kontext mit implizierten Rechten", async () => {
    const ctx = await makeCtx({ permissions: ["ORDERS_MANAGE"], level: 30 });
    expect(ctx.permissions).toContain("ORDERS_VIEW");
    expect(ctx.rank.level).toBe(30);
    expect(ctx.isAdmin).toBe(false);
  });

  it("erkennt den Admin", async () => {
    const ctx = await makeCtx({ isAdmin: true });
    expect(ctx.isAdmin).toBe(true);
  });
});
