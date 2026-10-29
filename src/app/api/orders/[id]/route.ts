import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, parseId } from "@/lib/api";
import { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "@/lib/types";

export const runtime = "nodejs";

/** Staff update: order status and/or payment status. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const orderId = parseId((await params).id);
    const body = (await request.json()) as { status?: unknown; paymentStatus?: unknown };
    const status = body.status === undefined ? undefined : (String(body.status) as OrderStatus);
    const paymentStatus = body.paymentStatus === undefined ? undefined : (String(body.paymentStatus) as PaymentStatus);

    if (
      !orderId ||
      (status === undefined && paymentStatus === undefined) ||
      (status !== undefined && !ORDER_STATUSES.includes(status)) ||
      (paymentStatus !== undefined && !PAYMENT_STATUSES.includes(paymentStatus))
    ) {
      return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
    }

    const store = await getStore();
    if (!(await store.updateOrder(orderId, { status, paymentStatus }))) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ orderId, status, paymentStatus });
  } catch (error) {
    return errorResponse(error, "Unable to update the order.");
  }
}
