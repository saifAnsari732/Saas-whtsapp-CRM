import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

describe("middleware — Firebase __session cookie auth guard", () => {
  it("allows access to public pages without __session cookie", async () => {
    const req = new NextRequest("https://app.test/login");
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated user to /login on protected routes", async () => {
    const req = new NextRequest("https://app.test/dashboard");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://app.test/login");
  });

  it("allows access to protected routes when __session cookie is present", async () => {
    const req = new NextRequest("https://app.test/dashboard", {
      headers: {
        cookie: "__session=firebase-session-token",
      },
    });
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows public API paths without session cookie", async () => {
    const req = new NextRequest("https://app.test/api/whatsapp/webhook");
    const res = await middleware(req);
    expect(res.headers.get("location")).toBeNull();
  });
});
