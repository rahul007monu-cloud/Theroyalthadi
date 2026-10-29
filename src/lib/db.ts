import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const databasePath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "royal-thadi.db");
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const globalDatabase = globalThis as typeof globalThis & { royalThadiDb?: Database.Database };

export const db = globalDatabase.royalThadiDb ?? new Database(databasePath);

if (process.env.NODE_ENV !== "production") globalDatabase.royalThadiDb = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_number INTEGER NOT NULL CHECK(table_number BETWEEN 1 AND 50),
    status TEXT NOT NULL DEFAULT 'NEW',
    total INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    menu_item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`);

export const ORDER_STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type StoredOrderItem = {
  id: number;
  order_id: number;
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
};

export type StoredOrder = {
  id: number;
  table_number: number;
  status: OrderStatus;
  total: number;
  note: string;
  created_at: string;
  items: StoredOrderItem[];
};

export function getOrders(): StoredOrder[] {
  const orders = db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 100").all() as Omit<StoredOrder, "items">[];
  const itemQuery = db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id");
  return orders.map((order) => ({
    ...order,
    items: itemQuery.all(order.id) as StoredOrderItem[]
  }));
}
