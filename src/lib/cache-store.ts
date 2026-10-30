import type { NewOrder, OrderChanges, Store } from "@/lib/store-types";
import type { PaymentMethod, ServiceRequest, ServiceType, StoredOrder } from "@/lib/types";

/** Subset of the Vercel Runtime Cache API that this store needs. */
export type KeyValueCache = {
  get: (key: string) => Promise<unknown | null>;
  set: (key: string, value: unknown, options?: { ttl?: number; name?: string }) => Promise<void>;
};

type StoredOrderWithRef = StoredOrder & { ref: string };
type ServiceRequestWithRef = ServiceRequest & { ref: string };

type State = {
  orders: StoredOrderWithRef[];
  requests: ServiceRequestWithRef[];
  nextOrderId: number;
  nextRequestId: number;
  version: number;
};

const STATE_KEY = "state";
const VERSION_KEY = "version";
/** Entries live for a week; the cache may still evict them earlier, which is why a real database is recommended. */
const TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_ORDERS = 80;
const KEEP_FINISHED_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const nowSql = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const randomRef = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const sqlToMs = (value: string) => new Date(`${value.replace(" ", "T")}Z`).getTime();

function emptyState(): State {
  return { orders: [], requests: [], nextOrderId: 1, nextRequestId: 1, version: 0 };
}

function isState(value: unknown): value is State {
  const state = value as State | null;
  return Boolean(state && Array.isArray(state.orders) && Array.isArray(state.requests) && typeof state.nextOrderId === "number");
}

function trim(state: State) {
  const cutoff = Date.now() - KEEP_FINISHED_MS;
  state.orders = state.orders
    .filter((order) => !["SERVED", "CANCELLED"].includes(order.status) || sqlToMs(order.created_at) >= cutoff)
    .slice(-MAX_ORDERS);
  state.requests = state.requests.filter((request) => request.status === "OPEN").slice(-100);
}

function publicOrder({ ref: _ref, ...order }: StoredOrderWithRef): StoredOrder {
  void _ref;
  return order;
}

function publicRequest({ ref: _ref, ...request }: ServiceRequestWithRef): ServiceRequest {
  void _ref;
  return request;
}

/**
 * Orders kept in a shared key-value cache (Vercel Runtime Cache) as one small JSON document.
 * Each change is read-modify-write followed by a re-read; if a concurrent write overwrote the
 * change, it is applied again. This keeps ordering working without any database setup.
 */
export function createCacheStore(
  cache: KeyValueCache,
  options: { settleMs?: number; confirmMs?: number } = {}
): Store & { getVersion(): Promise<number | null> } {
  // settleMs: short wait before the first check. confirmMs: wait long enough that any writer who read the
  // old state before our write has finished writing (cache calls time out after 500 ms), then check again.
  const settleMs = options.settleMs ?? 150;
  const confirmMs = options.confirmMs ?? 900;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async function readState(): Promise<State> {
    const value = await cache.get(STATE_KEY);
    return isState(value) ? value : emptyState();
  }

  async function mutate<T>(apply: (state: State) => T, isApplied: (state: State, result: T) => boolean): Promise<T> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (attempt > 0) await sleep(Math.random() * (settleMs + confirmMs) * Math.min(attempt, 3));
      const state = await readState();
      const result = apply(state);
      if (isApplied(state, result) === false) return result;
      state.version = Math.max(Date.now(), state.version + 1);
      trim(state);
      await cache.set(STATE_KEY, state, { ttl: TTL_SECONDS, name: "royal-thadi-state" });
      await sleep(settleMs);
      if (!isApplied(await readState(), result)) continue;
      await sleep(confirmMs);
      const confirmed = await readState();
      if (isApplied(confirmed, result)) {
        await cache.set(VERSION_KEY, confirmed.version, { ttl: TTL_SECONDS, name: "royal-thadi-version" });
        return result;
      }
    }
    throw new Error("Could not save the change. Please try again.");
  }

  return {
    async getVersion() {
      const value = await cache.get(VERSION_KEY);
      return typeof value === "number" ? value : null;
    },

    async createOrder(order: NewOrder) {
      const ref = randomRef();
      const total = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      return mutate(
        (state) => {
          const id = state.nextOrderId;
          state.nextOrderId += 1;
          state.orders.push({
            id,
            ref,
            table_number: order.tableNumber,
            status: "NEW",
            total,
            note: order.note,
            payment_method: "UNSELECTED",
            payment_status: "PENDING",
            created_at: nowSql(),
            items: order.items.map((item, index) => ({
              id: index + 1,
              order_id: id,
              menu_item_id: item.menuItemId,
              item_name: item.name,
              unit_price: item.unitPrice,
              quantity: item.quantity
            }))
          });
          return { id, total };
        },
        (state, result) => state.orders.some((saved) => saved.ref === ref && saved.id === result.id)
      );
    },

    async listOrders(limit = 100) {
      const state = await readState();
      return state.orders.slice(-limit).reverse().map(publicOrder);
    },

    async updateOrder(id: number, changes: OrderChanges) {
      let found = false;
      await mutate(
        (state) => {
          const order = state.orders.find((saved) => saved.id === id);
          found = Boolean(order);
          if (order) {
            if (changes.status) order.status = changes.status;
            if (changes.paymentMethod) order.payment_method = changes.paymentMethod;
            if (changes.paymentStatus) order.payment_status = changes.paymentStatus;
          }
          return null;
        },
        (state) => {
          if (!found) return false;
          const order = state.orders.find((saved) => saved.id === id);
          return Boolean(
            order &&
              (!changes.status || order.status === changes.status) &&
              (!changes.paymentMethod || order.payment_method === changes.paymentMethod) &&
              (!changes.paymentStatus || order.payment_status === changes.paymentStatus)
          );
        }
      );
      return found;
    },

    async recordPaymentChoice(id: number, method: PaymentMethod, claimedPaid: boolean) {
      let allowed = false;
      await mutate(
        (state) => {
          const order = state.orders.find((saved) => saved.id === id);
          allowed = Boolean(order && order.payment_status !== "PAID");
          if (order && allowed) {
            order.payment_method = method;
            if (claimedPaid) order.payment_status = "CLAIMED";
          }
          return null;
        },
        (state) => {
          if (!allowed) return false;
          const order = state.orders.find((saved) => saved.id === id);
          return Boolean(order && order.payment_method === method && (!claimedPaid || order.payment_status !== "PENDING"));
        }
      );
      return allowed;
    },

    async createServiceRequest(tableNumber: number, type: ServiceType) {
      const ref = randomRef();
      let duplicate: ServiceRequestWithRef | undefined;
      const created = await mutate(
        (state) => {
          duplicate = state.requests.find((request) => request.table_number === tableNumber && request.type === type && request.status === "OPEN");
          if (duplicate) return duplicate;
          const request: ServiceRequestWithRef = { id: state.nextRequestId, ref, table_number: tableNumber, type, status: "OPEN", created_at: nowSql() };
          state.nextRequestId += 1;
          state.requests.push(request);
          return request;
        },
        (state, result) => !duplicate && state.requests.some((request) => request.ref === result.ref)
      );
      return { request: publicRequest(created), duplicate: Boolean(duplicate) };
    },

    async listOpenServiceRequests() {
      const state = await readState();
      return state.requests.filter((request) => request.status === "OPEN").map(publicRequest);
    },

    async resolveServiceRequest(id: number) {
      let found = false;
      await mutate(
        (state) => {
          const before = state.requests.length;
          state.requests = state.requests.filter((request) => request.id !== id);
          found = state.requests.length < before;
          return null;
        },
        (state) => found && !state.requests.some((request) => request.id === id)
      );
      return found;
    }
  };
}
