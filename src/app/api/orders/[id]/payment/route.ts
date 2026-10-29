import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, parseId } from "@/lib/api";
import type { PaymentMethod } from "@/lib/types";

export const runtime = "nodejs";

/** Customer chooses UPI or counter payment, and can say "I have paid" (staff still confirms). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orderId = parseId((await params).id);
    const body = (await request.json()) as { method?: unknown; claimedPaid?: unknown };
    const method = String(body.method ?? "") as PaymentMethod;
    if (!orderId || !["UPI", "COUNTER"].includes(method)) {
      return NextResponse.json({ error: "Invalid payment choice." }, { status: 400 });
    }

    const store = await getStore();
    const updated = await store.recordPaymentChoice(orderId, method, method === "UPI" && body.claimedPaid === true);
    if (!updated) return NextResponse.json({ error: "Order not found or already paid." }, { status: 409 });
    return NextResponse.json({ orderId, method });
  } catch (error) {
    return errorResponse(error, "Unable to save the payment choice.");
  }
}
