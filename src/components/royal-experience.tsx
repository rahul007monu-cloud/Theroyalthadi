"use client";

import Image from "next/image";
import {
  ArrowRight,
  BellRing,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  MapPin,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  UtensilsCrossed,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { categories, menuItems, type MenuItem } from "@/data/menu";

type Cart = Record<number, number>;

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? "brand-lockup--compact" : ""}`}>
      <div className="brand-mark" aria-hidden="true">
        <Crown size={compact ? 15 : 18} strokeWidth={1.5} />
        <span>RT</span>
      </div>
      <div className="brand-copy">
        <span className="brand-the">The</span>
        <strong>Royal Thadi</strong>
        {!compact && <small>Ajmer · Rajasthan</small>}
      </div>
    </div>
  );
}

function RoyalDish() {
  return (
    <div className="royal-scene" aria-hidden="true">
      <div className="scene-glow" />
      <div className="orbit orbit-one"><span>✦</span></div>
      <div className="orbit orbit-two"><span>✦</span></div>
      <div className="floating-leaf leaf-one">◆</div>
      <div className="floating-leaf leaf-two">◆</div>
      <div className="plate-shadow" />
      <div className="royal-plate">
        <div className="plate-rim" />
        <div className="plate-food">
          <span className="food-core" />
          <span className="food-garnish garnish-one" />
          <span className="food-garnish garnish-two" />
          <span className="food-garnish garnish-three" />
        </div>
      </div>
      <div className="scene-seal">
        <Sparkles size={15} />
        <span>Crafted<br />to delight</span>
      </div>
    </div>
  );
}

function MenuCard({ item, quantity, onAdd, onChange }: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onChange: (amount: number) => void;
}) {
  return (
    <article className="menu-card">
      <div className="menu-card__image">
        <Image src={item.image} alt={item.name} fill sizes="(max-width: 720px) 86vw, (max-width: 1100px) 44vw, 340px" />
        <div className="menu-card__shade" />
        {item.badge && <span className="dish-badge"><Sparkles size={12} />{item.badge}</span>}
        <span className="veg-mark" title="Vegetarian"><i /></span>
      </div>
      <div className="menu-card__body">
        <div className="dish-heading">
          <div>
            <p>{item.hindiName}</p>
            <h3>{item.name}</h3>
          </div>
          <strong>₹{item.price}</strong>
        </div>
        <p className="dish-description">{item.description}</p>
        <div className="dish-footer">
          <span><Clock3 size={14} /> 15–20 min</span>
          {quantity === 0 ? (
            <button className="add-button" onClick={onAdd}>Add <Plus size={15} /></button>
          ) : (
            <div className="quantity-stepper" aria-label={`${item.name} quantity`}>
              <button onClick={() => onChange(-1)} aria-label="Remove one"><Minus size={14} /></button>
              <span>{quantity}</span>
              <button onClick={() => onChange(1)} aria-label="Add one"><Plus size={14} /></button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function RoyalExperience({ initialTable }: { initialTable: string }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);
  const [note, setNote] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const table = initialTable;

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory = category === "All" || item.category === category;
      const matchesSearch = !term || `${item.name} ${item.hindiName} ${item.description}`.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const cartLines = menuItems.filter((item) => cart[item.id]);
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const subtotal = cartLines.reduce((sum, item) => sum + item.price * cart[item.id], 0);

  function changeQuantity(id: number, amount: number) {
    setCart((current) => {
      const nextQuantity = Math.max(0, (current[id] ?? 0) + amount);
      const next = { ...current, [id]: nextQuantity };
      if (nextQuantity === 0) delete next[id];
      return next;
    });
  }

  function callWaiter() {
    setWaiterCalled(true);
    window.setTimeout(() => setWaiterCalled(false), 3200);
  }

  async function placeOrder() {
    if (cartLines.length === 0 || placingOrder) return;
    setPlacingOrder(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableNumber: Number(table),
          note,
          items: cartLines.map((item) => ({ menuItemId: item.id, quantity: cart[item.id] }))
        })
      });
      const result = await response.json() as { orderId?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to place order");
      setCart({});
      setNote("");
      setCartOpen(false);
      setOrderMessage(`Order #${result.orderId} sent from Table ${table}`);
      window.setTimeout(() => setOrderMessage(""), 4500);
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : "Unable to place order");
      window.setTimeout(() => setOrderMessage(""), 4500);
    } finally {
      setPlacingOrder(false);
    }
  }

  return (
    <main className="royal-page">
      <div className="noise" />
      <header className="topbar">
        <a href="#home" aria-label="The Royal Thadi home"><BrandMark compact /></a>
        <nav className={navOpen ? "nav-links nav-links--open" : "nav-links"}>
          <a href="#experience">Our story</a>
          <a href="#menu">Menu</a>
          <a href="#visit">Visit</a>
        </nav>
        <div className="header-actions">
          <button className="table-chip"><span>Table</span><strong>{table}</strong></button>
          <button className="bag-button" onClick={() => setCartOpen(true)} aria-label={`Open bag with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}>
            <ShoppingBag size={19} />
            {itemCount > 0 && <span>{itemCount}</span>}
          </button>
          <button className="nav-toggle" onClick={() => setNavOpen((open) => !open)} aria-label="Toggle navigation">
            {navOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-ornament hero-ornament--left" />
        <div className="hero-content">
          <div className="eyebrow"><span /><Crown size={14} /> A royal culinary affair</div>
          <p className="welcome-hindi">पधारो सा</p>
          <h1>Every flavour,<br /><em>served royally.</em></h1>
          <p className="hero-description">An elevated café experience where warm Indian hospitality meets modern indulgence.</p>
          <div className="hero-actions">
            <a className="primary-cta" href="#menu">Explore the menu <ArrowRight size={17} /></a>
            <button className="waiter-cta" onClick={callWaiter}><BellRing size={17} /> Call your host</button>
          </div>
          <div className="hero-trust">
            <div><strong>4.5</strong><span><Star size={12} fill="currentColor" /> Google rating</span></div>
            <i />
            <div><strong>50</strong><span>royal tables</span></div>
            <i />
            <div><strong>12 AM</strong><span>open till late</span></div>
          </div>
        </div>
        <div className="hero-visual"><RoyalDish /></div>
        <div className="vertical-copy">Nausar Ghati · Ajmer · Rajasthan</div>
      </section>

      <section className="experience-strip" id="experience">
        <p>Made with intention</p><span>◆</span><p>Served with warmth</p><span>◆</span><p>Remembered forever</p>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Curated for your table</span>
            <h2>Our royal <em>selection</em></h2>
          </div>
          <p>Thoughtfully prepared favourites, each finished with our signature touch.</p>
        </div>

        <div className="menu-toolbar">
          <div className="category-tabs" role="tablist" aria-label="Menu categories">
            {categories.map((item) => (
              <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)} role="tab" aria-selected={category === item}>{item}</button>
            ))}
          </div>
          <label className="search-field">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the menu" aria-label="Search the menu" />
          </label>
        </div>

        {visibleItems.length ? (
          <div className="menu-grid">
            {visibleItems.map((item) => (
              <MenuCard key={item.id} item={item} quantity={cart[item.id] ?? 0} onAdd={() => changeQuantity(item.id, 1)} onChange={(amount) => changeQuantity(item.id, amount)} />
            ))}
          </div>
        ) : (
          <div className="empty-search"><UtensilsCrossed /><h3>No dish found</h3><p>Try a different name or category.</p></div>
        )}
      </section>

      <section className="visit-section" id="visit">
        <div className="visit-card">
          <div className="visit-glow" />
          <div className="visit-copy">
            <span className="section-kicker">Come, stay a while</span>
            <h2>Your royal table<br />awaits.</h2>
            <p><MapPin size={17} /> Nausar Ghati, Pushkar Road, Ajmer</p>
          </div>
          <a href="https://www.google.com/maps/place/The+royal+thadi/@26.4877447,74.6054583,17z" target="_blank" rel="noreferrer">Get directions <ChevronRight size={18} /></a>
        </div>
      </section>

      <footer>
        <BrandMark />
        <p>Crafted with flavour. Served with warmth.</p>
        <div><a href="tel:+919982909045">+91 99829 09045</a><span>·</span><a href="/kitchen">Staff</a><span>·</span><a href="/admin">Admin</a></div>
      </footer>

      <button className={`floating-cart ${itemCount ? "floating-cart--visible" : ""}`} onClick={() => setCartOpen(true)}>
        <span><ShoppingBag size={18} /><b>{itemCount} {itemCount === 1 ? "item" : "items"}</b></span>
        <strong>₹{subtotal} <ArrowRight size={16} /></strong>
      </button>

      <div className={`cart-backdrop ${cartOpen ? "cart-backdrop--open" : ""}`} onClick={() => setCartOpen(false)} />
      <aside className={`cart-drawer ${cartOpen ? "cart-drawer--open" : ""}`} aria-hidden={!cartOpen}>
        <div className="drawer-header">
          <div><span>Table {table}</span><h2>Your royal order</h2></div>
          <button onClick={() => setCartOpen(false)} aria-label="Close bag"><X /></button>
        </div>
        <div className="cart-lines">
          {cartLines.length === 0 ? (
            <div className="empty-cart"><ShoppingBag /><h3>Your bag awaits</h3><p>Add something delicious from our royal selection.</p></div>
          ) : cartLines.map((item) => (
            <div className="cart-line" key={item.id}>
              <div className="cart-thumb"><Image src={item.image} alt="" fill sizes="68px" /></div>
              <div className="cart-line__copy"><h3>{item.name}</h3><p>₹{item.price}</p></div>
              <div className="quantity-stepper quantity-stepper--small">
                <button onClick={() => changeQuantity(item.id, -1)}><Minus size={13} /></button>
                <span>{cart[item.id]}</span>
                <button onClick={() => changeQuantity(item.id, 1)}><Plus size={13} /></button>
              </div>
            </div>
          ))}
        </div>
        {cartLines.length > 0 && (
          <div className="cart-summary">
            <label>Special request<textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="Less spicy, no onion…" /></label>
            <div><span>Subtotal</span><strong>₹{subtotal}</strong></div>
            <small>Taxes will be calculated on the final bill.</small>
            <button onClick={placeOrder} disabled={placingOrder}>{placingOrder ? "Sending to kitchen…" : `Place order · Table ${table}`}<ArrowRight size={17} /></button>
          </div>
        )}
      </aside>

      <div className={`service-toast ${waiterCalled || orderMessage ? "service-toast--visible" : ""}`}>
        <span><Check size={16} /></span>
        <div>
          <strong>{orderMessage || "Your host has been called"}</strong>
          <small>{orderMessage ? "The kitchen has received your table-tagged order." : `Someone will be at Table ${table} shortly.`}</small>
        </div>
      </div>
    </main>
  );
}
