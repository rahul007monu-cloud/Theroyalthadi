import { NextResponse } from "next/server";
import { getStorageMode, getStore } from "@/lib/store";
import { errorResponse } from "@/lib/api";
import type { LiveSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Orders + open service requests for the kitchen and admin screens.
 * Pass ?since=<version>; when nothing changed the response is tiny ({ unchanged: true }).
 */
export async function GET(request: Request) {
  try {
    const store = await getStore();
    const storage = await getStorageMode();
    const since = Number(new URL(request.url).searchParams.get("since"));
    const version = store.getVersion ? await store.getVersion() : null;

    if (version !== null && Number.isFinite(since) && since === version) {
      return NextResponse.json({ unchanged: true, version, storage }, { headers: { "Cache-Control": "no-store" } });
    }

    const [orders, requests] = await Promise.all([store.listOrders(), store.listOpenServiceRequests()]);
    const snapshot: LiveSnapshot = { version, storage, orders, requests };
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Unable to load live orders.");
  }
}
