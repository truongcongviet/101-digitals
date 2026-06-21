import { NextResponse } from "next/server";
import { fetchInvoiceDetail, UpstreamApiError } from "@/lib/api-client";
import { getServerSession } from "@/lib/auth";
import { upstreamErrorResponse } from "@/lib/route-responses";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const invoiceId = id?.trim();

  if (!invoiceId) {
    return NextResponse.json({ message: "Invoice id is required" }, { status: 400 });
  }

  try {
    const payload = await fetchInvoiceDetail(invoiceId, session);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof UpstreamApiError) {
      return upstreamErrorResponse(error);
    }

    return NextResponse.json({ message: "Unexpected invoice detail error" }, { status: 500 });
  }
}
