import { getApiBaseUrl, getRequiredEnv, getTokenUrl } from "@/lib/env";
import type { CreateInvoiceInput, InvoiceQuery, LoginInput } from "@/lib/validations";
import { buildCreateInvoicePayload } from "@/lib/validations";

type UpstreamErrorPayload = {
  message?: string;
  error?: string;
};

type TokenResult = {
  accessToken: string;
  expiresIn?: number;
};

export class UpstreamApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown
  ) {
    super(message);
  }
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function upstreamErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object") {
    const errorPayload = payload as UpstreamErrorPayload;
    return errorPayload.message ?? errorPayload.error ?? fallback;
  }

  return fallback;
}

async function assertOk(response: Response, fallback: string) {
  const payload = await parseJson(response);

  if (!response.ok) {
    throw new UpstreamApiError(upstreamErrorMessage(payload, fallback), response.status, payload);
  }

  return payload;
}

export async function exchangePasswordForToken(input: LoginInput): Promise<TokenResult> {
  const body = new URLSearchParams({
    client_id: getRequiredEnv("OAUTH_CLIENT_ID"),
    client_secret: getRequiredEnv("OAUTH_CLIENT_SECRET"),
    grant_type: "password",
    scope: "openid",
    username: input.username,
    password: input.password
  });

  const response = await fetch(getTokenUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body,
    cache: "no-store"
  });

  const payload = await assertOk(response, "Login failed");

  if (!payload || typeof payload !== "object" || !("access_token" in payload)) {
    throw new UpstreamApiError("Token response did not include access_token", response.status, payload);
  }

  const tokenPayload = payload as { access_token: unknown; expires_in?: unknown };
  const expiresIn = Number(tokenPayload.expires_in);

  return {
    accessToken: String(tokenPayload.access_token),
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : undefined
  };
}

export async function fetchOrgToken(accessToken: string): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/membership-service/1.0.0/users/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  const payload = await assertOk(response, "Unable to load user profile");

  if (!payload || typeof payload !== "object") {
    throw new UpstreamApiError("User profile response was invalid", response.status, payload);
  }

  const profile = payload as {
    data?: { memberships?: Array<{ token?: string }> };
    memberships?: Array<{ token?: string }>;
  };
  const memberships = profile.data?.memberships ?? profile.memberships;
  const orgToken = memberships?.[0]?.token;

  if (!orgToken) {
    throw new UpstreamApiError("User profile did not include an organization token", 502, payload);
  }

  return orgToken;
}

export async function fetchInvoices(
  query: InvoiceQuery,
  session: { accessToken: string; orgToken: string }
) {
  const url = new URL(`${getApiBaseUrl()}/invoice-service/1.0.0/invoices`);

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: authorizedHeaders(session),
    cache: "no-store"
  });

  return assertOk(response, "Unable to fetch invoices");
}

export async function fetchInvoiceDetail(
  invoiceId: string,
  session: { accessToken: string; orgToken: string }
) {
  const response = await fetch(
    `${getApiBaseUrl()}/invoice-service/1.0.0/invoices/${encodeURIComponent(invoiceId)}`,
    {
      headers: authorizedHeaders(session),
      cache: "no-store"
    }
  );

  return assertOk(response, "Unable to fetch invoice detail");
}

export async function createInvoice(
  input: CreateInvoiceInput,
  session: { accessToken: string; orgToken: string }
) {
  const response = await fetch(`${getApiBaseUrl()}/invoice-service/1.0.0/invoices`, {
    method: "POST",
    headers: {
      ...authorizedHeaders(session),
      "Content-Type": "application/json",
      "Operation-Mode": "SYNC"
    },
    body: JSON.stringify(buildCreateInvoicePayload(input)),
    cache: "no-store"
  });

  return assertOk(response, "Unable to create invoice");
}

function authorizedHeaders(session: { accessToken: string; orgToken: string }) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    "org-token": session.orgToken
  };
}
