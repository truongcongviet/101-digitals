import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOrgToken } from "@/lib/api-client";

describe("fetchOrgToken", () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
});
