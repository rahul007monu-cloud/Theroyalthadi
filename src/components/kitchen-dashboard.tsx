"use client";

import Link from "next/link";
import { BellRing, Check, ChefHat, Clock3, Droplets, LayoutDashboard, ReceiptIndianRupee, RefreshCw, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DashBrand } from "@/components/dash-brand";
import { PaymentBadge } from "@/components/payment-badge";
import type { OrderStatus, ServiceRequest, StoredOrder } from "@/lib/types";
import { minutesSince, relativeTime, SERVICE_LABELS } from "@/lib/time";

const columns: { status: OrderStatus; title: string; action: string; next: OrderStatus }[] = [
  { status: "NEW", title: "New orders", action: "Accept order", next: "ACCEPTED" },
  { status: "ACCEPTED", title: "Accepted", action: "Start preparing", next: "PREPARING" },
  { status: "PREPARING", title: "Preparing", action: "Mark ready", next: "READY" },
  { status: "READY", title: "Ready to serve", action: "Mark served", next: "SERVED" }
];

const serviceIcons: Record<string, LucideIcon> = { WAITER: BellRing, WATER: Droplets, BILL: ReceiptIndianRupee };

export function KitchenDashboard() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [ordersResponse, requestsResponse] = await Promise.all([
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/service-requests", { cache: "no-store" })
      ]);
      if (!ordersResponse.ok || !requestsResponse.ok) throw new Error("Server not reachable");
      setOrders(((await ordersResponse.json()) as { orders: StoredOrder[] }).orders);
      setRequests(((await requestsResponse.json()) as { requests: ServiceRequest[] }).requests);
      setError("");
    } catch {
      setError("Orders load नहीं हुए। Internet / server check करें।");
    } finally {
      setLoading(false);
      setNow(Date.now());
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(load, 0);
    const timer = window.setInterval(load, 3000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  const activeOrders = useMemo(() => orders.filter((order) => columns.some((column) => column.status === order.status)), [orders]);
  const waiting = orders.filter((order) => order.status === "NEW").length;

  async function moveOrder(id: number, status: OrderStatus) {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    }).catch(() => null);
    if (!response?.ok) await load();
  }

  async function markPaid(id: number) {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, payment_status: "PAID" } : order)));
    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "PAID" })
    }).catch(() => null);
    if (!response?.ok) await load();
  }

  async function resolveRequest(id: number) {
    setRequests((current) => current.filter((request) => request.id !== id));
    const response = await fetch(`/api/service-requests/${id}`, { method: "PATCH" }).catch(() => null);
    if (!response?.ok) await load();
  }

  return (
    <main className="kitchen-shell">
      <header className="kitchen-topbar">
        <DashBrand label="Kitchen display" />
        <div className="kitchen-topbar__actions">
          <span className={`live-pill ${error ? "live-pill--down" : ""}`}>
            <i /> {error ? "Offline" : "Live"}
          </span>
          <button type="button" className="dash-icon-button" onClick={load} aria-label="Refresh orders">
            <RefreshCw size={18} />
          </button>
          <Link className="dash-link-button" href="/admin">
            <LayoutDashboard size={18} /> Admin
          </Link>
        </div>
      </header>

      <section className="kitchen-heading">
        <div>
          <p className="dash-kicker">Live service · 50 tables</p>
          <h1>Kitchen orders</h1>
        </div>
        <div className="kitchen-heading__stats">
          <div>
            <strong>{waiting}</strong>
            <span>New</span>
          </div>
          <div>
            <strong>{activeOrders.length}</strong>
            <span>Active</span>
          </div>
          <div className={requests.length ? "is-alert" : ""}>
            <strong>{requests.length}</strong>
            <span>Calls</span>
          </div>
        </div>
      </section>

      {error && <p className="dash-error">{error}</p>}

      {requests.length > 0 && (
        <section className="service-strip" aria-label="Table service requests">
          {requests.map((request) => {
            const Icon = serviceIcons[request.type] ?? BellRing;
            return (
              <article className={`service-card service-card--${request.type.toLowerCase()}`} key={request.id}>
                <span className="service-card__icon">
                  <Icon size={22} />
                </span>
                <div>
                  <strong>Table {String(request.table_number).padStart(2, "0")}</strong>
                  <span>
                    {SERVICE_LABELS[request.type] ?? request.type} · {now ? relativeTime(request.created_at, now) : "…"}
                  </span>
                </div>
                <button type="button" onClick={() => resolveRequest(request.id)}>
                  <Check size={17} /> Done
                </button>
              </article>
            );
          })}
        </section>
      )}

      <section className="kanban-board">
        {columns.map((column) => {
          const columnOrders = activeOrders.filter((order) => order.status === column.status).reverse();
          return (
            <div className={`kanban-column column-${column.status.toLowerCase()}`} key={column.status}>
              <header>
                <span>{column.title}</span>
                <b>{columnOrders.length}</b>
              </header>
              <div className="kanban-list">
                {columnOrders.length === 0 ? (
                  <div className="column-empty">
                    {loading ? <RefreshCw className="spin" size={26} /> : <ChefHat size={26} />}
                    <span>{loading ? "Loading…" : "No orders"}</span>
                  </div>
                ) : (
                  columnOrders.map((order) => {
                    const late = now !== null && minutesSince(order.created_at, now) > 15;
                    return (
                      <article className={`order-ticket ${late ? "is-late" : ""}`} key={order.id}>
                        <div className="ticket-top">
                          <div>
                            <small>Table</small>
                            <strong>{String(order.table_number).padStart(2, "0")}</strong>
                          </div>
                          <span>#{String(order.id).padStart(3, "0")}</span>
                        </div>
                        <p className="ticket-time">
                          <Clock3 size={15} /> {now ? relativeTime(order.created_at, now) : "…"}
                          {late && <em>Late</em>}
                        </p>
                        <ul className="ticket-items">
                          {order.items.map((item) => (
                            <li key={item.id}>
                              <b>{item.quantity}×</b>
                              <span>{item.item_name}</span>
                            </li>
                          ))}
                        </ul>
                        {order.note && (
                          <p className="ticket-note">
                            <UtensilsCrossed size={15} /> {order.note}
                          </p>
                        )}
                        <div className="ticket-total">
                          <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                          <strong>₹{order.total}</strong>
                        </div>
                        <div className="ticket-payment">
                          <PaymentBadge order={order} />
                          {order.payment_status !== "PAID" && (
                            <button type="button" onClick={() => markPaid(order.id)}>
                              Mark paid
                            </button>
                          )}
                        </div>
                        <button type="button" onClick={() => moveOrder(order.id, column.next)}>
                          {column.next === "SERVED" && <Check size={17} />}
                          {column.action}
                        </button>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
