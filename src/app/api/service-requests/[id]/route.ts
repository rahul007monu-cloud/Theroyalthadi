import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const requestId = Number(id);
    if (!Number.isInteger(requestId)) return NextResponse.json({ error: "Invalid request id." }, { status: 400 });

    const result = getDb().prepare("UPDATE service_requests SET status = 'DONE' WHERE id = ?").run(requestId);
    if (result.changes === 0) return NextResponse.json({ error: "Request not found." }, { status: 404 });

    return NextResponse.json({ requestId, status: "DONE" });
  } catch (error) {
    return errorResponse(error, "Unable to update the request.");
  }
}
