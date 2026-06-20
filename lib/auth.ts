import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "simple_invoice_access_token";
export const ORG_TOKEN_COOKIE = "simple_invoice_org_token";

const MAX_AGE_SECONDS = 60 * 60;
const EXPIRY_BUFFER_SECONDS = 60;

export type ServerSession = {
  accessToken: string;
  orgToken: string;
};

function cookieOptions(maxAge = MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge
  };
}

export function getSessionCookieMaxAge(expiresIn?: number) {
  if (!expiresIn || !Number.isFinite(expiresIn)) {
    return MAX_AGE_SECONDS;
  }

  return Math.max(1, Math.floor(expiresIn - EXPIRY_BUFFER_SECONDS));
}

export function setAuthCookies(
  response: NextResponse,
  session: ServerSession,
  options: { maxAge?: number } = {}
) {
  const cookieConfig = cookieOptions(options.maxAge);

  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, cookieConfig);
  response.cookies.set(ORG_TOKEN_COOKIE, session.orgToken, cookieConfig);
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0
  });
  response.cookies.set(ORG_TOKEN_COOKIE, "", {
    ...cookieOptions(),
    maxAge: 0
  });
}

export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const orgToken = cookieStore.get(ORG_TOKEN_COOKIE)?.value;

  if (!accessToken || !orgToken) {
    return null;
  }

  return { accessToken, orgToken };
}
