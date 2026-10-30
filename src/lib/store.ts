import "server-only";
import fs from "node:fs";
import path from "node:path";
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ServiceRequest,
  ServiceType,
  StorageMode,
  StoredOrder,
  StoredOrderItem
} from "@/lib/types";
import type { Store } from "@/lib/store-types";
import { createCacheStore } from "@/lib/cache-store";

export type { NewOrder, NewOrderItem, OrderChanges, Store } from "@/lib/store-types";

/** Thrown when no database can be reached (for example Vercel without a connected database). */
export class DatabaseUnavailableError extends Error {}

/** Minimal query interface shared by `pg` and PGlite (used for tests). */
export type Queryable = { query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };

const ORDER_COLUMNS = `id, table_number, status, total, note, payment_method, payment_status,
  to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS created_at`;
const REQUEST_COLUMNS = `id, table_number, type, status, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS') AS created_at`;

const POSTGRES_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL CHECK (table_number BETWEEN 1 AND 50),
    status TEXT NOT NULL DEFAULT 'NEW',
    total INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    payment_method TEXT NOT NULL DEFAULT 'UNSELECTED',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
  )`,
  `CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id)`,
  `CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    table_number INTEGER NOT NULL CHECK (table_number BETWEEN 1 AND 50),
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`
];

function toOrder(row: Record<string, unknown>, items: StoredOrderItem[]): StoredOrder {
  return {
    id: Number(row.id),
    table_number: Number(row.table_number),
    status: row.status as OrderStatus,
    total: Number(row.total),
    note: String(row.note ?? ""),
    payment_method: row.payment_method as PaymentMethod,
    payment_status: row.payment_status as PaymentStatus,
    created_at: String(row.created_at),
    items
  };
}

function toItem(row: Record<string, unknown>): StoredOrderItem {
  return {
    id: Number(row.id),
    order_id: Number(row.order_id),
    menu_item_id: Number(row.menu_item_id),
    item_name: String(row.item_name),
    unit_price: Number(row.unit_price),
    quantity: Number(row.quantity)
  };
}

function toRequest(row: Record<string, unknown>): ServiceRequest {
  return {
    id: Number(row.id),
    table_number: Number(row.table_number),
    type: row.type as ServiceType,
    status: row.status as ServiceRequest["status"],
    created_at: String(row.created_at)
  };
}

export async function ensurePostgresSchema(db: Queryable) {
  for (const statement of POSTGRES_SCHEMA) {
    try {
      await db.query(statement);
    } catch (error) {
      // Two cold starts creating the same table at once can race; the second attempt sees it.
      await db.query(statement).catch(() => {
        throw error;
      });
    }
  }
}

export function createPostgresStore(db: Queryable): Store {
  return {
    async createOrder(order) {
      const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const { rows } = await db.query(
        `WITH new_order AS (
           INSERT INTO orders (table_number, total, note) VALUES ($1, $2, $3) RETURNING id
         ), inserted AS (
           INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity)
           SELECT new_order.id, item.menu_item_id, item.item_name, item.unit_price, item.quantity
           FROM new_order, unnest($4::int[], $5::text[], $6::int[], $7::int[]) AS item(menu_item_id, item_name, unit_price, quantity)
           RETURNING order_id
         )
         SELECT id FROM new_order`,
        [
          order.tableNumber,
          total,
          order.note,
          order.items.map((item) => item.menuItemId),
          order.items.map((item) => item.name),
          order.items.map((item) => item.unitPrice),
          order.items.map((item) => item.quantity)
        ]
      );
      return { id: Number(rows[0].id), total };
    },

    async listOrders(limit = 100) {
      const { rows } = await db.query(`SELECT ${ORDER_COLUMNS} FROM orders ORDER BY id DESC LIMIT $1`, [limit]);
      if (!rows.length) return [];
      const ids = rows.map((row) => Number(row.id));
      const itemRows = (await db.query("SELECT * FROM order_items WHERE order_id = ANY($1::int[]) ORDER BY id", [ids])).rows;
      const itemsByOrder = new Map<number, StoredOrderItem[]>();
      itemRows.map(toItem).forEach((item) => itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item]));
      return rows.map((row) => toOrder(row, itemsByOrder.get(Number(row.id)) ?? []));
    },

    async updateOrder(id, changes) {
      const { rows } = await db.query(
        `UPDATE orders SET
           status = COALESCE($2, status),
           payment_method = COALESCE($3, payment_method),
           payment_status = COALESCE($4, payment_status)
         WHERE id = $1 RETURNING id`,
        [id, changes.status ?? null, changes.paymentMethod ?? null, changes.paymentStatus ?? null]
      );
      return rows.length > 0;
    },

    async recordPaymentChoice(id, method, claimedPaid) {
      const { rows } = await db.query(
        `UPDATE orders SET
           payment_method = $2,
           payment_status = CASE WHEN $3::boolean THEN 'CLAIMED' ELSE payment_status END
         WHERE id = $1 AND payment_status <> 'PAID' RETURNING id`,
        [id, method, claimedPaid]
      );
      return rows.length > 0;
    },

    async createServiceRequest(tableNumber, type) {
      const inserted = await db.query(
        `INSERT INTO service_requests (table_number, type)
         SELECT $1, $2
         WHERE NOT EXISTS (SELECT 1 FROM service_requests WHERE table_number = $1 AND type = $2 AND status = 'OPEN')
         RETURNING ${REQUEST_COLUMNS}`,
        [tableNumber, type]
      );
      if (inserted.rows[0]) return { request: toRequest(inserted.rows[0]), duplicate: false };
      const existing = await db.query(
        `SELECT ${REQUEST_COLUMNS} FROM service_requests WHERE table_number = $1 AND type = $2 AND status = 'OPEN' ORDER BY id LIMIT 1`,
        [tableNumber, type]
      );
      return { request: toRequest(existing.rows[0]), duplicate: true };
    },

    async listOpenServiceRequests() {
      const { rows } = await db.query(`SELECT ${REQUEST_COLUMNS} FROM service_requests WHERE status = 'OPEN' ORDER BY id LIMIT 100`);
      return rows.map(toRequest);
    },

    async resolveServiceRequest(id) {
      const { rows } = await db.query("UPDATE service_requests SET status = 'DONE' WHERE id = $1 RETURNING id", [id]);
      return rows.length > 0;
    }
  };
}

async function createSqliteStore(): Promise<Store> {
  const { default: Database } = await import("better-sqlite3");
  const databasePath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "royal-thadi.db");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new Database(databasePath);
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
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0)
    );
    CREATE TABLE IF NOT EXISTS service_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER NOT NULL CHECK(table_number BETWEEN 1 AND 50),
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const columns = (db.prepare("PRAGMA table_info(orders)").all() as { name: string }[]).map((column) => column.name);
  if (!columns.includes("payment_method")) db.exec("ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'UNSELECTED'");
  if (!columns.includes("payment_status")) db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'PENDING'");

  return {
    async createOrder(order) {
      const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const insert = db.transaction(() => {
        const result = db.prepare("INSERT INTO orders (table_number, total, note) VALUES (?, ?, ?)").run(order.tableNumber, total, order.note);
        const orderId = Number(result.lastInsertRowid);
        const insertItem = db.prepare("INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)");
        order.items.forEach((item) => insertItem.run(orderId, item.menuItemId, item.name, item.unitPrice, item.quantity));
        return orderId;
      });
      return { id: insert(), total };
    },
    async listOrders(limit = 100) {
      const rows = db.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT ?").all(limit) as Record<string, unknown>[];
      const itemQuery = db.prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id");
      return rows.map((row) => toOrder(row, (itemQuery.all(Number(row.id)) as Record<string, unknown>[]).map(toItem)));
    },
    async updateOrder(id, changes) {
      const result = db
        .prepare(
          "UPDATE orders SET status = COALESCE(?, status), payment_method = COALESCE(?, payment_method), payment_status = COALESCE(?, payment_status) WHERE id = ?"
        )
        .run(changes.status ?? null, changes.paymentMethod ?? null, changes.paymentStatus ?? null, id);
      return result.changes > 0;
    },
    async recordPaymentChoice(id, method, claimedPaid) {
      const result = db
        .prepare(
          "UPDATE orders SET payment_method = ?, payment_status = CASE WHEN ? THEN 'CLAIMED' ELSE payment_status END WHERE id = ? AND payment_status <> 'PAID'"
        )
        .run(method, claimedPaid ? 1 : 0, id);
      return result.changes > 0;
    },
    async createServiceRequest(tableNumber, type) {
      const existing = db
        .prepare("SELECT * FROM service_requests WHERE table_number = ? AND type = ? AND status = 'OPEN' LIMIT 1")
        .get(tableNumber, type) as Record<string, unknown> | undefined;
      if (existing) return { request: toRequest(existing), duplicate: true };
      const result = db.prepare("INSERT INTO service_requests (table_number, type) VALUES (?, ?)").run(tableNumber, type);
      const created = db.prepare("SELECT * FROM service_requests WHERE id = ?").get(Number(result.lastInsertRowid)) as Record<string, unknown>;
      return { request: toRequest(created), duplicate: false };
    },
    async listOpenServiceRequests() {
      return (db.prepare("SELECT * FROM service_requests WHERE status = 'OPEN' ORDER BY id LIMIT 100").all() as Record<string, unknown>[]).map(toRequest);
    },
    async resolveServiceRequest(id) {
      return db.prepare("UPDATE service_requests SET status = 'DONE' WHERE id = ?").run(id).changes > 0;
    }
  };
}

const globalStore = globalThis as typeof globalThis & { royalThadiStore?: Promise<{ store: Store; kind: "postgres" | "cache" | "sqlite" }> };

function hasRuntimeCache() {
  const context = (globalThis as Record<symbol, { get?: () => { cache?: unknown } } | undefined>)[Symbol.for("@vercel/request-context")]?.get?.();
  return Boolean(context?.cache || (process.env.RUNTIME_CACHE_ENDPOINT && process.env.RUNTIME_CACHE_HEADERS));
}

async function openStore(): Promise<{ store: Store; kind: "postgres" | "cache" | "sqlite" }> {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (connectionString) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8_000 });
    await ensurePostgresSchema(pool);
    return { store: createPostgresStore(pool), kind: "postgres" };
  }
  if (process.env.VERCEL) {
    // No database connected yet: use Vercel Runtime Cache, which needs no setup.
    const { getCache } = await import("@vercel/functions");
    return { store: createCacheStore(getCache({ namespace: "royal-thadi-v1" })), kind: "cache" };
  }
  return { store: await createSqliteStore(), kind: "sqlite" };
}

async function openOnce() {
  if (!globalStore.royalThadiStore) {
    globalStore.royalThadiStore = openStore().catch((error) => {
      globalStore.royalThadiStore = undefined;
      throw new DatabaseUnavailableError(error instanceof Error ? error.message : "Database unavailable");
    });
  }
  return globalStore.royalThadiStore;
}

export async function getStore(): Promise<Store> {
  return (await openOnce()).store;
}

/** Call inside a request: Runtime Cache availability is known per request. */
export async function getStorageMode(): Promise<StorageMode> {
  const { kind } = await openOnce();
  if (kind === "cache") return hasRuntimeCache() ? "runtime-cache" : "memory";
  return kind;
}
