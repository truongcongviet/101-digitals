import { NextResponse } from "next/server";
import { createInvoice, fetchInvoices, UpstreamApiError } from "@/lib/api-client";
import { clearAuthCookies, getServerSession } from "@/lib/auth";
import { createInvoiceInputSchema, invoiceQuerySchema } from "@/lib/validations";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = invoiceQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid invoice query", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const payload = await fetchInvoices(parsed.data, session);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof UpstreamApiError) {
      return upstreamErrorResponse(error);
    }

    return NextResponse.json({ message: "Unexpected invoice fetch error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createInvoiceInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid invoice payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const payload = await createInvoice(parsed.data, session);
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    if (error instanceof UpstreamApiError) {
      return upstreamErrorResponse(error);
    }

    return NextResponse.json({ message: "Unexpected invoice create error" }, { status: 500 });
  }
}

function upstreamErrorResponse(error: UpstreamApiError) {
  const response = NextResponse.json(
    { message: error.message, details: error.payload },
    { status: error.status }
  );

  if (error.status === 401) {
    clearAuthCookies(response);
  }

  return response;
}
