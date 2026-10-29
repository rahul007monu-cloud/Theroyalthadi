import { NextResponse } from "next/server";
import { getDb, getOpenServiceRequests, SERVICE_TYPES, type ServiceRequest, type ServiceType } from "@/lib/db";
import { errorResponse, parseTableNumber } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ requests: getOpenServiceRequests() }, { headers: { "Cache-Control": "no-store" } });
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

    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM service_requests WHERE table_number = ? AND type = ? AND status = 'OPEN' LIMIT 1")
      .get(tableNumber, type) as ServiceRequest | undefined;
    if (existing) return NextResponse.json({ request: existing, duplicate: true });

    const result = db.prepare("INSERT INTO service_requests (table_number, type) VALUES (?, ?)").run(tableNumber, type);
    const created = db.prepare("SELECT * FROM service_requests WHERE id = ?").get(Number(result.lastInsertRowid)) as ServiceRequest;
    return NextResponse.json({ request: created, duplicate: false }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to send the request.");
  }
}
