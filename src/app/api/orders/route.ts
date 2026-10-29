import { NextResponse } from "next/server";
import { getDb, getOrders } from "@/lib/db";
import { errorResponse, parseTableNumber } from "@/lib/api";
import { menuItems } from "@/data/menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RequestedItem = { menuItemId?: unknown; quantity?: unknown };

export async function GET() {
  try {
    return NextResponse.json({ orders: getOrders() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error, "Unable to load orders.");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { tableNumber?: unknown; items?: unknown; note?: unknown };
    const tableNumber = parseTableNumber(body.tableNumber);

    if (!tableNumber) {
      return NextResponse.json({ error: "Table number must be between 1 and 50." }, { status: 400 });
    }

    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 60) {
      return NextResponse.json({ error: "At least one item is required." }, { status: 400 });
    }

    const requestedItems = (body.items as RequestedItem[]).map((requested) => {
      const menuItem = menuItems.find((item) => item.id === Number(requested.menuItemId));
      const quantity = Number(requested.quantity);
      if (!menuItem || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
      return { menuItem, quantity };
    });

    if (requestedItems.some((item) => item === null)) {
      return NextResponse.json({ error: "One or more order items are invalid." }, { status: 400 });
    }

    const validItems = requestedItems.filter((item): item is NonNullable<typeof item> => item !== null);
    const total = validItems.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
    const db = getDb();

    const createOrder = db.transaction(() => {
      const result = db.prepare("INSERT INTO orders (table_number, total, note) VALUES (?, ?, ?)").run(tableNumber, total, note);
      const orderId = Number(result.lastInsertRowid);
      const insertItem = db.prepare(
        "INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)"
      );
      for (const item of validItems) {
        insertItem.run(orderId, item.menuItem.id, item.menuItem.name, item.menuItem.price, item.quantity);
      }
      return orderId;
    });

    const orderId = createOrder();
    return NextResponse.json({ orderId, tableNumber, status: "NEW", total }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to place the order.");
  }
}
