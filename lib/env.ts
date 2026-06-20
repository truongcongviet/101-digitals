const DEFAULT_AUTH_BASE_URL = "https://is-wso2-dev.101digital.io";
const DEFAULT_API_BASE_URL = "https://api-neobank-dev.101digital.io";

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getAuthBaseUrl(): string {
  return process.env.AUTH_BASE_URL ?? DEFAULT_AUTH_BASE_URL;
}

export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

export function getTokenUrl(): string {
  const authBaseUrl = getAuthBaseUrl().replace(/\/$/, "");

  if (authBaseUrl.endsWith("/t/101digital.core")) {
    return `${authBaseUrl}/oauth2/token`;
  }

  return `${authBaseUrl}/t/101digital.core/oauth2/token`;
}
