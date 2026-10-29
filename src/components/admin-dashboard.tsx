"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  Crown,
  Download,
  Grid2X2,
  IndianRupee,
  LayoutDashboard,
  Menu as MenuIcon,
  QrCode,
  Settings,
  ShoppingBag,
  Sparkles,
  Upload,
  Users,
  UtensilsCrossed
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { menuItems } from "@/data/menu";
import type { StoredOrder } from "@/lib/db";

type AdminView = "overview" | "tables" | "menu" | "settings";

const navigation: { id: AdminView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "tables", label: "50 Tables & QR", icon: Grid2X2 },
  { id: "menu", label: "Menu", icon: MenuIcon },
  { id: "settings", label: "Settings", icon: Settings }
];

function AdminBrand() {
  return <div className="dash-brand"><span><Crown size={17} /><b>RT</b></span><div><strong>The Royal Thadi</strong><small>Owner Console</small></div></div>;
}

export function AdminDashboard() {
  const [view, setView] = useState<AdminView>("overview");
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [paymentQr, setPaymentQr] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const response = await fetch("/api/orders", { cache: "no-store" });
    if (response.ok) setOrders(((await response.json()) as { orders: StoredOrder[] }).orders);
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(loadOrders, 0);
    const timer = window.setInterval(loadOrders, 5000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [loadOrders]);

  const activeOrders = orders.filter((order) => !["SERVED", "CANCELLED"].includes(order.status));
  const activeTables = new Map(activeOrders.map((order) => [order.table_number, order.status]));
  const sales = orders.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + order.total, 0);
  const title = navigation.find((item) => item.id === view)?.label;

  function uploadPaymentQr(file?: File) {
    if (!file) return;
    if (paymentQr) URL.revokeObjectURL(paymentQr);
    setPaymentQr(URL.createObjectURL(file));
  }

  return (
    <main className="dashboard-shell">
      <aside className="dash-sidebar">
        <AdminBrand />
        <nav>
          {navigation.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)}><item.icon size={18} /><span>{item.label}</span></button>)}
        </nav>
        <div className="dash-sidebar__bottom">
          <Link href="/kitchen"><UtensilsCrossed size={17} />Kitchen display</Link>
          <Link href="/"><ChevronRight size={17} />Customer view</Link>
        </div>
      </aside>

      <section className="dash-main">
        <header className="dash-topbar">
          <div><span>Live · Royal operations</span><h1>{title}</h1></div>
          <div className="live-pill"><i /> Live</div>
        </header>

        {view === "overview" && <>
          <div className="stat-grid">
            <article><span><IndianRupee /></span><div><small>Total order value</small><strong>₹{sales.toLocaleString("en-IN")}</strong><p>Across {orders.length} orders</p></div></article>
            <article><span><ShoppingBag /></span><div><small>Active orders</small><strong>{activeOrders.length}</strong><p>Live kitchen queue</p></div></article>
            <article><span><Users /></span><div><small>Occupied tables</small><strong>{activeTables.size}<em>/50</em></strong><p>{50 - activeTables.size} tables available</p></div></article>
            <article><span><BarChart3 /></span><div><small>Average order</small><strong>₹{orders.length ? Math.round(sales / orders.length) : 0}</strong><p>Current average value</p></div></article>
          </div>
          <div className="dash-two-column">
            <section className="dash-panel">
              <div className="panel-title"><div><small>Live service</small><h2>Table overview</h2></div><button onClick={() => setView("tables")}>View all <ChevronRight size={15} /></button></div>
              <div className="mini-table-grid">
                {Array.from({ length: 50 }, (_, index) => index + 1).map((table) => <button key={table} className={activeTables.has(table) ? `occupied status-${activeTables.get(table)?.toLowerCase()}` : ""}><span>{String(table).padStart(2, "0")}</span><small>{activeTables.get(table) ?? "Free"}</small></button>)}
              </div>
            </section>
            <section className="dash-panel recent-orders">
              <div className="panel-title"><div><small>Latest</small><h2>Recent orders</h2></div><span className="order-count">{orders.length}</span></div>
              {orders.length === 0 ? <div className="dash-empty"><ShoppingBag /><h3>No orders yet</h3><p>New QR orders will appear here.</p></div> : orders.slice(0, 7).map((order) => <article key={order.id}><b>#{String(order.id).padStart(3, "0")}</b><div><strong>Table {String(order.table_number).padStart(2, "0")}</strong><small>{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</small></div><span className={`status-label status-${order.status.toLowerCase()}`}>{order.status}</span><em>₹{order.total}</em></article>)}
            </section>
          </div>
        </>}

        {view === "tables" && <section className="dash-panel table-manager">
          <div className="panel-title"><div><small>Unique, table-tagged links</small><h2>QR codes · Tables 01–50</h2></div><p>Each QR sends orders with its exact table number.</p></div>
          <div className="qr-grid">
            {Array.from({ length: 50 }, (_, index) => index + 1).map((table) => (
              <article key={table}>
                <div className="qr-image"><Image src={`/api/qr?table=${table}`} alt={`QR code for table ${table}`} width={120} height={120} unoptimized /></div>
                <div><small>Royal table</small><strong>{String(table).padStart(2, "0")}</strong><span className={activeTables.has(table) ? "busy" : "free"}>{activeTables.get(table) ?? "Available"}</span></div>
                <a href={`/api/qr?table=${table}`} download={`royal-thadi-table-${table}.png`} title={`Download Table ${table} QR`}><Download size={16} /></a>
              </article>
            ))}
          </div>
        </section>}

        {view === "menu" && <section className="dash-panel menu-manager">
          <div className="panel-title"><div><small>Digital catalogue</small><h2>Menu management</h2></div><button><Sparkles size={14} /> Add item</button></div>
          <div className="menu-list">
            {menuItems.map((item) => <article key={item.id}><div className="admin-dish-image"><Image src={item.image} alt={item.name} fill sizes="58px" /></div><div><strong>{item.name}</strong><small>{item.category} · {item.hindiName}</small></div><b>₹{item.price}</b><span>Available</span><button>Edit</button></article>)}
          </div>
        </section>}

        {view === "settings" && <div className="settings-grid">
          <section className="dash-panel setting-card"><span className="setting-icon"><QrCode /></span><small>Payments</small><h2>Payment QR</h2><p>Upload your UPI or counter payment QR whenever you are ready.</p><label className="upload-box">{paymentQr ? <Image src={paymentQr} alt="Payment QR preview" width={180} height={180} unoptimized /> : <><Upload /><strong>Upload payment QR</strong><span>PNG or JPG</span></>}<input type="file" accept="image/png,image/jpeg" onChange={(event) => uploadPaymentQr(event.target.files?.[0])} /></label></section>
          <section className="dash-panel setting-card"><span className="setting-icon"><Crown /></span><small>Restaurant</small><h2>The Royal Thadi</h2><div className="setting-fields"><label>Phone<input value="+91 99829 09045" readOnly /></label><label>Total tables<input value="50" readOnly /></label><label>Location<input value="Nausar Ghati, Ajmer" readOnly /></label></div></section>
        </div>}
      </section>
    </main>
  );
}
