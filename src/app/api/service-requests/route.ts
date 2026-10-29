import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, parseTableNumber } from "@/lib/api";
import { SERVICE_TYPES, type ServiceType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json({ requests: await store.listOpenServiceRequests() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Unable to load service requests.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tableNumber?: unknown; type?: unknown };
    const tableNumber = parseTableNumber(body.tableNumber);
    const type = String(body.type ?? "") as ServiceType;
    if (!tableNumber || !SERVICE_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid service request." }, { status: 400 });
    }
    const store = await getStore();
    const result = await store.createServiceRequest(tableNumber, type);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, "Unable to send the request.");
  }
}
