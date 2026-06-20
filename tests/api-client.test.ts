import { afterEach, describe, expect, it, vi } from "vitest";
import { exchangePasswordForToken, fetchOrgToken } from "@/lib/api-client";
import { getSessionCookieMaxAge } from "@/lib/auth";

describe("api client auth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns access token expiry metadata from the token response", async () => {
    process.env.OAUTH_CLIENT_ID = "client-id";
    process.env.OAUTH_CLIENT_SECRET = "client-secret";

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "access-token", expires_in: 300 }), {
        status: 200
      })
    );

    await expect(
      exchangePasswordForToken({ username: "94756921275", password: "secret" })
    ).resolves.toEqual({
      accessToken: "access-token",
      expiresIn: 300
    });
  });

  it("extracts org token from the Postman profile wrapper shape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            memberships: [{ token: "org-token-from-data" }]
          }
        }),
        { status: 200 }
      )
    );

    await expect(fetchOrgToken("access-token")).resolves.toBe("org-token-from-data");
  });

  it("returns a gateway-style error when the profile has no org token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { memberships: [] } }), { status: 200 })
    );

    await expect(fetchOrgToken("access-token")).rejects.toMatchObject({
      status: 502,
      message: "User profile did not include an organization token"
    });
  });

  it("sets session cookies to expire before the upstream access token", () => {
    expect(getSessionCookieMaxAge(300)).toBe(240);
  });
});
