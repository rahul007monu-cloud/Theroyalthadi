import { NextResponse } from "next/server";
import { getDb, ORDER_STATUSES, type OrderStatus } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orderId = Number(id);
    const body = (await request.json()) as { status?: unknown };
    const status = String(body.status ?? "") as OrderStatus;

    if (!Number.isInteger(orderId) || !ORDER_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid order update." }, { status: 400 });
    }

    const result = getDb().prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
    if (result.changes === 0) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    return NextResponse.json({ orderId, status });
  } catch (error) {
    return errorResponse(error, "Unable to update the order.");
  }
}
