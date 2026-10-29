import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { errorResponse, parseTableNumber } from "@/lib/api";
import { menuItems } from "@/data/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestedItem = { menuItemId?: unknown; quantity?: unknown };

export async function GET() {
  try {
    const store = await getStore();
    return NextResponse.json({ orders: await store.listOrders() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Unable to load orders.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tableNumber?: unknown; items?: unknown; note?: unknown };
    const tableNumber = parseTableNumber(body.tableNumber);
    if (!tableNumber) return NextResponse.json({ error: "Please choose a table between 1 and 50." }, { status: 400 });

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 80) {
      return NextResponse.json({ error: "At least one item is required." }, { status: 400 });
    }

    const items = (body.items as RequestedItem[]).map((requested) => {
      const menuItem = menuItems.find((item) => item.id === Number(requested.menuItemId));
      const quantity = Number(requested.quantity);
      if (!menuItem || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
      return { menuItemId: menuItem.id, name: menuItem.name, unitPrice: menuItem.price, quantity };
    });
    if (items.some((item) => item === null)) {
      return NextResponse.json({ error: "One or more order items are invalid." }, { status: 400 });
    }

    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
    const store = await getStore();
    const created = await store.createOrder({ tableNumber, note, items: items.filter((item) => item !== null) });
    return NextResponse.json({ orderId: created.id, tableNumber, status: "NEW", total: created.total }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to place the order.");
  }
}
