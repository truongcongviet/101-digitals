# SimpleInvoice

SimpleInvoice is a Next.js + TypeScript implementation for the 101 Digital Web Engineer assessment. The project follows the recommended BFF architecture from `02_Implementation_Guide_Advice.md` and covers the functional requirements summarized in `01_Assessment_Requirements_Summary.md`.

## Architecture

The browser never calls 101 Digital services directly. Client components call local Next.js route handlers, and those handlers call the real upstream APIs from the server:

- `POST /api/auth/login` exchanges username/password for `access_token`, then calls `GET /membership-service/1.0.0/users/me` to get `org_token`.
- `GET /api/invoices` proxies list/search/filter/sort/pagination requests to the invoice service.
- `POST /api/invoices` validates the create-invoice input on the server and posts the invoice with `Operation-Mode: SYNC`.
- `GET /api/invoices/[id]` proxies invoice detail requests.

Tokens are stored only in `httpOnly`, `SameSite=Lax`, `Secure` cookies. They are never stored in `localStorage`, `sessionStorage`, React state, or exposed through `NEXT_PUBLIC_*`.

## Tech Stack

- Next.js 15 App Router
- TypeScript
- React Hook Form + Zod
- TanStack Table
- Vitest + Testing Library
- CSS with responsive layouts and security-conscious BFF routing

## Environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required values:

```bash
OAUTH_CLIENT_ID="replace-with-client-id"
OAUTH_CLIENT_SECRET="replace-with-client-secret"
AUTH_BASE_URL="https://is-wso2-dev.101digital.io"
API_BASE_URL="https://api-neobank-dev.101digital.io"
```

Do not use `NEXT_PUBLIC_` for these variables.

## Run Locally

```bash
yarn install
yarn dev
```

Open `http://localhost:3000`.

## Test

```bash
yarn test
```

The current tests cover login validation, create-invoice validation, date rules, and the invoice payload builder.

## Build

```bash
yarn build
```

## Implemented Requirements

- Login form with client-side validation.
- Server-side token exchange through a Next.js route handler.
- `access_token` and `org_token` stored in secure httpOnly cookies.
- Protected dashboard routes through middleware and server layout checks.
- Invoice list as the default authenticated landing page.
- Search, status/date filters, sorting, pagination.
- Invoice detail route and modal, with list data fallback when the upstream detail endpoint is unavailable.
- Create invoice form with exactly one line item.
- Server-side validation for login, invoice query, and invoice creation.
- Create-invoice payload aligned with `SimpleInvoice_101Digital.postman_collection.json`.
- `.env.example` with placeholder-only environment variables.
- Security headers in `next.config.mjs`.
- Unit tests for core validation and payload mapping.

## Notes On Postman Files

The Postman collection/environment are used as the source of truth for upstream details not present in the markdown summary:

- Token URL: `{{authBaseUrl}}/t/101digital.core/oauth2/token`.
- Login body: `client_id`, `client_secret`, `grant_type=password`, `scope=openid`, `username`, `password`.
- Invoice list query: `sortBy`, `ordering`, `pageNum`, `pageSize`, optional `keyword`, `status`, `fromDate`, `toDate`.
- Create invoice body: `bankAccount`, `customer.contact`, `customer.addresses`, `documents`, `customFields`, invoice `extensions`, and one `items[]` entry with item-level extensions.

The environment file contains sandbox credentials. Keep any real `.env.local` out of git and treat those values as secrets.
