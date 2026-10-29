import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

export const ORDER_STATUSES = ["NEW", "ACCEPTED", "PREPARING", "READY", "SERVED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const SERVICE_TYPES = ["WAITER", "WATER", "BILL"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

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

export type ServiceRequest = {
  id: number;
  table_number: number;
  type: ServiceType;
  status: "OPEN" | "DONE";
  created_at: string;
};

/** Thrown when the database cannot be opened (for example on a read-only serverless filesystem). */
export class DatabaseUnavailableError extends Error {}

const globalDatabase = globalThis as typeof globalThis & { royalThadiDb?: Database.Database };

function openDatabase() {
  const databasePath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "royal-thadi.db");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.pragma("foreign_keys = ON");
  database.exec(`
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

    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER NOT NULL CHECK(table_number BETWEEN 1 AND 50),
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return database;
}

export function getDb(): Database.Database {
  if (globalDatabase.royalThadiDb) return globalDatabase.royalThadiDb;
  try {
    globalDatabase.royalThadiDb = openDatabase();
    return globalDatabase.royalThadiDb;
  } catch (error) {
    throw new DatabaseUnavailableError(error instanceof Error ? error.message : "Database unavailable");
  }
}

export function getOrders(): StoredOrder[] {
  const db = getDb();
  const orders = db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 100").all() as Omit<StoredOrder, "items">[];
  const itemQuery = db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id");
  return orders.map((order) => ({ ...order, items: itemQuery.all(order.id) as StoredOrderItem[] }));
}

export function getOpenServiceRequests(): ServiceRequest[] {
  return getDb().prepare("SELECT * FROM service_requests WHERE status = 'OPEN' ORDER BY id ASC LIMIT 100").all() as ServiceRequest[];
}
