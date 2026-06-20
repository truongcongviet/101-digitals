import { NextResponse } from "next/server";
import { exchangePasswordForToken, fetchOrgToken, UpstreamApiError } from "@/lib/api-client";
import { setAuthCookies } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid login payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const accessToken = await exchangePasswordForToken(parsed.data);
    const orgToken = await fetchOrgToken(accessToken);
    const response = NextResponse.json({ ok: true });

    setAuthCookies(response, { accessToken, orgToken });
    return response;
  } catch (error) {
    if (error instanceof UpstreamApiError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    return NextResponse.json({ message: "Unexpected login error" }, { status: 500 });
  }
}
