"use client";

import Link from "next/link";
import { BellRing, Check, ChefHat, Clock3, Crown, LayoutDashboard, RefreshCw, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { OrderStatus, StoredOrder } from "@/lib/db";

const columns: { status: OrderStatus; title: string; action: string; next: OrderStatus }[] = [
  { status: "NEW", title: "New orders", action: "Accept order", next: "ACCEPTED" },
  { status: "ACCEPTED", title: "Accepted", action: "Start preparing", next: "PREPARING" },
  { status: "PREPARING", title: "In the kitchen", action: "Mark ready", next: "READY" },
  { status: "READY", title: "Ready to serve", action: "Mark served", next: "SERVED" }
];

function orderAgeMinutes(date: string) {
  return Math.max(0, (Date.now() - new Date(`${date}Z`).getTime()) / 60000);
}

function relativeTime(date: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(`${date}Z`).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export function KitchenDashboard() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadOrders = useCallback(async () => {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (response.ok) {
      setOrders(((await response.json()) as { orders: StoredOrder[] }).orders);
      setLastUpdated(new Date());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(loadOrders, 0);
    const timer = window.setInterval(loadOrders, 3000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadOrders]);

  const activeOrders = useMemo(() => orders.filter((order) => columns.some((column) => column.status === order.status)), [orders]);

  async function moveOrder(id: number, status: OrderStatus) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    const response = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (!response.ok) await loadOrders();
  }

  return (
    <main className="kitchen-shell">
      <header className="kitchen-topbar">
        <div className="dash-brand"><span><Crown size={17} /><b>RT</b></span><div><strong>The Royal Thadi</strong><small>Kitchen Display</small></div></div>
        <div className="kitchen-summary"><span><i /> Kitchen live</span><b>{activeOrders.length} active orders</b><small>Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small><button onClick={loadOrders} aria-label="Refresh orders"><RefreshCw size={17} /></button><Link href="/admin"><LayoutDashboard size={17} />Admin</Link></div>
      </header>
      <section className="kitchen-heading"><div><span>Live service · 50 table system</span><h1>Kitchen command</h1></div><div><BellRing /><strong>{orders.filter((order) => order.status === "NEW").length}</strong><span>waiting</span></div></section>
      <section className="kanban-board">
        {columns.map((column) => {
          const columnOrders = activeOrders.filter((order) => order.status === column.status);
          return <div className={`kanban-column column-${column.status.toLowerCase()}`} key={column.status}>
            <header><span>{column.title}</span><b>{columnOrders.length}</b></header>
            <div className="kanban-list">
              {columnOrders.length === 0 ? <div className="column-empty">{loading ? <RefreshCw className="spin" /> : <ChefHat />}<span>{loading ? "Loading orders" : "No orders here"}</span></div> : columnOrders.map((order) => <article className="order-ticket" key={order.id}>
                <div className="ticket-top"><div><small>Table</small><strong>{String(order.table_number).padStart(2, "0")}</strong></div><span>#{String(order.id).padStart(3, "0")}</span></div>
                <div className="ticket-time"><Clock3 size={13} />{relativeTime(order.created_at)}<i className={orderAgeMinutes(order.created_at) > 15 ? "late" : ""} /></div>
                <div className="ticket-items">{order.items.map((item) => <div key={item.id}><b>{item.quantity}×</b><span>{item.item_name}</span></div>)}</div>
                {order.note && <p className="ticket-note"><UtensilsCrossed size={13} />{order.note}</p>}
                <div className="ticket-total"><span>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</span><strong>₹{order.total}</strong></div>
                <button onClick={() => moveOrder(order.id, column.next)}>{column.next === "SERVED" && <Check size={15} />}{column.action}</button>
              </article>)}
            </div>
          </div>;
        })}
      </section>
    </main>
  );
}
