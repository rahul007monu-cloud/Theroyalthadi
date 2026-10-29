import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, parseId } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const requestId = parseId((await params).id);
    if (!requestId) return NextResponse.json({ error: "Invalid request id." }, { status: 400 });
    const store = await getStore();
    if (!(await store.resolveServiceRequest(requestId))) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    return NextResponse.json({ requestId, status: "DONE" });
  } catch (error) {
    return errorResponse(error, "Unable to update the request.");
  }
}
