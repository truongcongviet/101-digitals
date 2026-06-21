import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import type { UpstreamApiError } from "@/lib/api-client";

export function upstreamErrorResponse(error: UpstreamApiError) {
  const response = NextResponse.json(
    { message: error.message, details: error.payload },
    { status: error.status }
  );

  if (error.status === 401) {
    clearAuthCookies(response);
  }

  return response;
}
