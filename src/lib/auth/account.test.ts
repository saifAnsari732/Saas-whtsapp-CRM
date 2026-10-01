import { describe, expect, it, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  userDoc: { exists: true, data: () => ({ accountId: "acct-1", accountRole: "owner" }) },
  accountDoc: { exists: true, id: "acct-1", data: () => ({ name: "Acme" }) },
}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => "Bearer token-123" }),
  cookies: async () => ({ get: () => ({ value: "session-123" }) }),
}));

vi.mock("@/lib/firebase/admin", () => ({
  getAdminAuth: () => ({
    verifySessionCookie: h.verifyToken,
    verifyIdToken: h.verifyToken,
  }),
  getAdminDb: () => ({
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          if (name === "users") return h.userDoc;
          if (name === "accounts") return h.accountDoc;
          return { exists: false, data: () => null };
        },
      }),
    }),
  }),
}));

import { getCurrentAccount, UnauthorizedError, ForbiddenError } from "./account";

describe("getCurrentAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.verifyToken.mockResolvedValue({ uid: "user-1" });
    h.userDoc = { exists: true, data: () => ({ accountId: "acct-1", accountRole: "owner" }) };
    h.accountDoc = { exists: true, id: "acct-1", data: () => ({ name: "Acme" }) };
  });

  it("resolves context via Firebase Admin SDK", async () => {
    const ctx = await getCurrentAccount();
    expect(ctx).toMatchObject({
      userId: "user-1",
      accountId: "acct-1",
      role: "owner",
      account: { id: "acct-1", name: "Acme" },
    });
  });

  it("throws UnauthorizedError when auth verification fails", async () => {
    h.verifyToken.mockRejectedValue(new Error("Invalid token"));
    await expect(getCurrentAccount()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("rejects a profile not linked to an account", async () => {
    h.userDoc = { exists: true, data: () => ({ accountId: null, accountRole: null }) as any };
    await expect(getCurrentAccount()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("rejects an account_id that resolves to no readable account", async () => {
    h.accountDoc = { exists: false, id: "acct-1", data: () => null as any };
    await expect(getCurrentAccount()).rejects.toBeInstanceOf(ForbiddenError);
  });
});
