"use client";

import dynamic from "next/dynamic";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BellRing,
  Check,
  ChefHat,
  Citrus,
  Coffee,
  CookingPot,
  Crown,
  CupSoda,
  Droplets,
  GlassWater,
  Leaf,
  MapPin,
  Martini,
  Milk,
  Minus,
  Phone,
  Pizza,
  Plus,
  ReceiptIndianRupee,
  Sandwich,
  Search,
  ShoppingBag,
  Soup,
  Star,
  Wheat,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categoryHindi, menuCategories, menuItems, royalPickNames, type MenuCategory, type MenuItem } from "@/data/menu";

const KulladScene = dynamic(() => import("@/components/kullad-scene"), { ssr: false });

const categoryIcons: Record<MenuCategory, LucideIcon> = {
  "Maggi House": CookingPot,
  Snacks: Sandwich,
  "Pizza House": Pizza,
  "Paratha House": Wheat,
  "Pasta House": ChefHat,
  "Thadi Special": Citrus,
  "Tea House": Leaf,
  "Coffee Special": Coffee,
  Shakes: CupSoda,
  Smoothie: GlassWater,
  Soup,
  Cocktails: Martini,
  "Lassi House": Milk
};

type Cart = Record<number, number>;
type ServiceType = "WAITER" | "WATER" | "BILL";
type Sheet = "cart" | "service" | null;
type Toast = { title: string; detail: string; tone: "success" | "error" };
type PlacedOrder = { id: number; total: number; items: number };

const serviceOptions: { type: ServiceType; title: string; hindi: string; icon: LucideIcon }[] = [
  { type: "WAITER", title: "Call waiter", hindi: "वेटर बुलाएँ", icon: BellRing },
  { type: "WATER", title: "Water", hindi: "पानी", icon: Droplets },
  { type: "BILL", title: "Bring bill", hindi: "बिल लाएँ", icon: ReceiptIndianRupee }
];

const MAPS_URL = "https://www.google.com/maps/place/The+royal+thadi/@26.4877447,74.6054583,17z";
const lowestPrice = Math.min(...menuItems.map((item) => item.price));

function sectionId(category: MenuCategory) {
  return `menu-${category.toLowerCase().replace(/[^a-z]+/g, "-")}`;
}

function QuantityControl({ item, quantity, onChange }: { item: MenuItem; quantity: number; onChange: (amount: number) => void }) {
  if (quantity === 0) {
    return (
      <button type="button" className="rt-add" onClick={() => onChange(1)} aria-label={`Add ${item.name}`}>
        Add <Plus size={15} strokeWidth={2.4} />
      </button>
    );
  }
  return (
    <div className="rt-stepper" role="group" aria-label={`${item.name} quantity`}>
      <button type="button" onClick={() => onChange(-1)} aria-label={`Remove one ${item.name}`}>
        <Minus size={15} strokeWidth={2.6} />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button type="button" onClick={() => onChange(1)} aria-label={`Add one ${item.name}`} disabled={quantity >= 20}>
        <Plus size={15} strokeWidth={2.6} />
      </button>
    </div>
  );
}

function KulladPoster({ hidden }: { hidden: boolean }) {
  return (
    <svg className={`rt-poster ${hidden ? "is-hidden" : ""}`} viewBox="0 0 320 320" aria-hidden="true">
      <defs>
        <linearGradient id="rt-poster-clay" x1="0" x2="1">
          <stop offset="0" stopColor="#5e2612" />
          <stop offset="0.32" stopColor="#b8643a" />
          <stop offset="0.56" stopColor="#cf7d4d" />
          <stop offset="0.8" stopColor="#97482a" />
          <stop offset="1" stopColor="#4b1c0c" />
        </linearGradient>
        <linearGradient id="rt-poster-gold" x1="0" x2="1">
          <stop offset="0" stopColor="#7a5419" />
          <stop offset="0.35" stopColor="#f3d58c" />
          <stop offset="0.6" stopColor="#b8862f" />
          <stop offset="0.85" stopColor="#f6dc98" />
          <stop offset="1" stopColor="#7a5419" />
        </linearGradient>
        <linearGradient id="rt-poster-plate" x1="0" x2="1">
          <stop offset="0" stopColor="#2a0a0d" />
          <stop offset="0.5" stopColor="#5c1b21" />
          <stop offset="1" stopColor="#2a0a0d" />
        </linearGradient>
        <radialGradient id="rt-poster-chai" cx="0.45" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#8f5430" />
          <stop offset="0.7" stopColor="#bd8152" />
          <stop offset="1" stopColor="#e3bd8e" />
        </radialGradient>
        <radialGradient id="rt-poster-shadow">
          <stop offset="0" stopColor="#000" stopOpacity="0.7" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="270" rx="130" ry="22" fill="url(#rt-poster-shadow)" />
      <ellipse cx="160" cy="252" rx="114" ry="22" fill="url(#rt-poster-plate)" stroke="url(#rt-poster-gold)" strokeWidth="3" />
      <path d="M94 104 L226 104 L205 236 Q160 252 115 236 Z" fill="url(#rt-poster-clay)" />
      <path d="M102 162 Q160 178 218 162" fill="none" stroke="url(#rt-poster-gold)" strokeWidth="4" />
      <ellipse cx="160" cy="104" rx="68" ry="15" fill="url(#rt-poster-gold)" />
      <ellipse cx="160" cy="105" rx="58" ry="11" fill="url(#rt-poster-chai)" />
      <g className="rt-poster__steam" fill="none" stroke="#fff3df" strokeLinecap="round" strokeWidth="5" strokeOpacity="0.24">
        <path d="M138 88 C126 70 150 58 138 40" />
        <path d="M162 86 C150 64 176 52 162 30" />
        <path d="M186 88 C174 70 198 58 186 42" />
      </g>
    </svg>
  );
}

export function RoyalExperience({ table }: { table: string | null }) {
  const [cart, setCart] = useState<Cart>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(menuCategories[0]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sendingService, setSendingService] = useState<ServiceType | null>(null);
  const toastTimer = useRef<number | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const term = search.trim().toLowerCase();
  const sections = useMemo(
    () =>
      menuCategories
        .map((category) => ({
          category,
          items: menuItems.filter(
            (item) =>
              item.category === category &&
              (!term || `${item.name} ${item.description ?? ""} ${category} ${categoryHindi[category]}`.toLowerCase().includes(term))
          )
        }))
        .filter((section) => section.items.length > 0),
    [term]
  );
  const royalPicks = useMemo(
    () => royalPickNames.map((name) => menuItems.find((item) => item.name === name)).filter((item): item is MenuItem => Boolean(item)),
    []
  );
  const cartLines = useMemo(() => menuItems.filter((item) => cart[item.id]), [cart]);
  const itemCount = cartLines.reduce((sum, item) => sum + cart[item.id], 0);
  const subtotal = cartLines.reduce((sum, item) => sum + item.price * cart[item.id], 0);

  const showToast = useCallback((title: string, detail: string, tone: Toast["tone"] = "success") => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ title, detail, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const changeQuantity = useCallback((id: number, amount: number) => {
    setCart((current) => {
      const nextQuantity = Math.min(20, Math.max(0, (current[id] ?? 0) + amount));
      const next = { ...current, [id]: nextQuantity };
      if (nextQuantity === 0) delete next[id];
      return next;
    });
  }, []);

  // Highlight the category chip for the section currently near the top of the screen.
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-menu-section]"));
    if (!elements.length) return;
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => visible.set(entry.target.getAttribute("data-menu-section") ?? "", entry.isIntersecting));
        const first = sections.find((section) => visible.get(section.category));
        if (first) setActiveCategory(first.category);
      },
      { rootMargin: "-150px 0px -55% 0px", threshold: 0 }
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    const container = chipsRef.current;
    const chip = container?.querySelector<HTMLElement>(`[data-chip="${activeCategory}"]`);
    if (!container || !chip) return;
    container.scrollTo({ left: chip.offsetLeft - container.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [activeCategory]);

  useEffect(() => {
    const locked = sheet !== null || placedOrder !== null;
    document.body.style.overflow = locked ? "hidden" : "";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSheet(null);
        setPlacedOrder(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet, placedOrder]);

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    []
  );

  function goToCategory(category: MenuCategory) {
    setActiveCategory(category);
    document.getElementById(sectionId(category))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function placeOrder() {
    if (!table || cartLines.length === 0 || placing) return;
    setPlacing(true);
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
      const result = (await response.json().catch(() => ({}))) as { orderId?: number; total?: number; error?: string };
      if (!response.ok || !result.orderId) throw new Error(result.error ?? "कृपया दोबारा कोशिश करें या waiter को बुलाएँ।");
      setPlacedOrder({ id: result.orderId, total: result.total ?? subtotal, items: itemCount });
      setCart({});
      setNote("");
      setSheet(null);
    } catch (error) {
      showToast("Order नहीं जा पाया", error instanceof Error ? error.message : "कृपया दोबारा कोशिश करें।", "error");
    } finally {
      setPlacing(false);
    }
  }

  async function requestService(type: ServiceType) {
    const option = serviceOptions.find((item) => item.type === type);
    if (!table || !option) {
      showToast("Table QR scan करें", "Service के लिए अपनी table पर लगा QR scan करें।", "error");
      return;
    }
    setSendingService(type);
    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: Number(table), type })
      });
      const result = (await response.json().catch(() => ({}))) as { duplicate?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "कृपया दोबारा कोशिश करें।");
      setSheet(null);
      showToast(`${option.hindi} · Table ${table}`, result.duplicate ? "आपकी request पहले से staff के पास है।" : "Staff को सूचना भेज दी गई है।");
    } catch (error) {
      showToast("Request नहीं गई", error instanceof Error ? error.message : "कृपया दोबारा कोशिश करें।", "error");
    } finally {
      setSendingService(null);
    }
  }

  return (
    <main className="rt">
      <div className="rt-ambient" aria-hidden="true" />

      <header className="rt-header">
        <a className="rt-brand" href="#top" aria-label="The Royal Thadi, back to top">
          <span className="rt-crest">
            <Crown size={17} strokeWidth={1.8} />
          </span>
          <span className="rt-brand__text">
            <small>The</small>
            <strong>Royal Thadi</strong>
          </span>
        </a>
        <div className="rt-header__actions">
          <span className={`rt-table-pill ${table ? "" : "rt-table-pill--empty"}`}>
            {table ? (
              <>
                Table <b>{table}</b>
              </>
            ) : (
              "Menu"
            )}
          </span>
          <button
            type="button"
            className="rt-icon-button"
            onClick={() => setSheet("cart")}
            aria-label={`Open your order, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          >
            <ShoppingBag size={19} />
            {itemCount > 0 && <span className="rt-badge">{itemCount}</span>}
          </button>
        </div>
      </header>

      <section className="rt-hero" id="top">
        <div className="rt-hero__stage">
          <div className="rt-hero__halo" aria-hidden="true" />
          <KulladPoster hidden={sceneReady} />
          <KulladScene onReady={() => setSceneReady(true)} onFail={() => setSceneReady(false)} />
        </div>
        <div className="rt-hero__copy">
          <p className="rt-eyebrow">
            <span />
            Nausar Ghati · Ajmer
            <span />
          </p>
          <h1>
            <span className="rt-hindi-display" lang="hi">
              पधारो सा
            </span>
            <span className="rt-wordmark">The Royal Thadi</span>
          </h1>
          <p className="rt-hero__lede">Kullad chai, masala maggi and hot street snacks, served the royal way.</p>
          <ul className="rt-hero__facts">
            <li>
              <Star size={14} fill="currentColor" /> 4.5 on Google
            </li>
            <li>{menuItems.length} dishes</li>
            <li>From ₹{lowestPrice}</li>
          </ul>
          <div className="rt-hero__actions">
            <a className="rt-button rt-button--gold" href="#menu">
              Menu देखें <ArrowRight size={18} />
            </a>
            <button type="button" className="rt-button rt-button--ghost" onClick={() => setSheet("service")}>
              <BellRing size={18} /> Service
            </button>
          </div>
          {!table && <p className="rt-hero__hint">Order करने के लिए अपनी table पर लगा QR code scan करें।</p>}
        </div>
      </section>

      <section className="rt-picks" aria-labelledby="rt-picks-title">
        <div className="rt-section-head">
          <p className="rt-kicker">Royal picks</p>
          <h2 id="rt-picks-title">
            Start with a <em>classic</em>
          </h2>
        </div>
        <div className="rt-picks__rail">
          {royalPicks.map((item) => {
            const Icon = categoryIcons[item.category];
            return (
              <article className="rt-pick" key={item.id}>
                <div className="rt-pick__medal">
                  <Icon size={30} strokeWidth={1.4} />
                </div>
                <p className="rt-pick__category">{item.category}</p>
                <h3>{item.name}</h3>
                <div className="rt-pick__footer">
                  <strong>₹{item.price}</strong>
                  <QuantityControl item={item} quantity={cart[item.id] ?? 0} onChange={(amount) => changeQuantity(item.id, amount)} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rt-menu" id="menu" aria-labelledby="rt-menu-title">
        <div className="rt-section-head rt-section-head--center">
          <p className="rt-kicker">The menu · मेन्यू</p>
          <h2 id="rt-menu-title">
            Our royal <em>selection</em>
          </h2>
        </div>

        <label className="rt-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search maggi, chai, pizza…" aria-label="Search the menu" />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </label>

        <nav className="rt-chips-bar" aria-label="Menu categories">
          <div className="rt-chips" ref={chipsRef}>
            {sections.map(({ category }) => (
              <button
                type="button"
                key={category}
                data-chip={category}
                className={`rt-chip ${activeCategory === category ? "is-active" : ""}`}
                onClick={() => goToCategory(category)}
                aria-current={activeCategory === category ? "true" : undefined}
              >
                {category}
              </button>
            ))}
          </div>
        </nav>

        {sections.length === 0 ? (
          <div className="rt-empty">
            <Search size={26} />
            <h3>“{search}” नहीं मिला</h3>
            <p>कोई दूसरा नाम लिखकर देखें।</p>
          </div>
        ) : (
          <div className="rt-sections">
            {sections.map(({ category, items }) => {
              const Icon = categoryIcons[category];
              return (
                <section
                  key={category}
                  id={sectionId(category)}
                  data-menu-section={category}
                  className="rt-category"
                  aria-labelledby={`${sectionId(category)}-title`}
                >
                  <header className="rt-category__head">
                    <span className="rt-category__icon">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <div>
                      <h3 id={`${sectionId(category)}-title`}>{category}</h3>
                      <p lang="hi">{categoryHindi[category]}</p>
                    </div>
                    <span className="rt-category__count" aria-label={`${items.length} items`}>
                      {items.length}
                    </span>
                  </header>
                  <ul className="rt-items">
                    {items.map((item) => (
                      <li className="rt-item" key={item.id}>
                        <span className="rt-veg" title="Vegetarian">
                          <i />
                        </span>
                        <div className="rt-item__copy">
                          <span className="rt-item__name">{item.name}</span>
                          {item.description && <span className="rt-item__note">{item.description}</span>}
                        </div>
                        <span className="rt-item__leader" aria-hidden="true" />
                        <span className="rt-item__price">₹{item.price}</span>
                        <QuantityControl item={item} quantity={cart[item.id] ?? 0} onChange={(amount) => changeQuantity(item.id, amount)} />
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <section className="rt-visit" aria-labelledby="rt-visit-title">
        <div className="rt-visit__card">
          <p className="rt-kicker">Visit us</p>
          <h2 id="rt-visit-title">Nausar Ghati, Pushkar Road</h2>
          <p className="rt-visit__address">
            <MapPin size={18} /> FJQ4+35W, Nausar Ghati, Ajmer, Rajasthan 305004
          </p>
          <div className="rt-visit__actions">
            <a className="rt-button rt-button--gold" href={MAPS_URL} target="_blank" rel="noreferrer">
              Directions <ArrowRight size={18} />
            </a>
            <a className="rt-button rt-button--ghost" href="tel:+919982909045">
              <Phone size={17} /> Call
            </a>
          </div>
        </div>
      </section>

      <footer className="rt-footer">
        <span className="rt-crest rt-crest--large">
          <Crown size={22} strokeWidth={1.6} />
        </span>
        <strong>The Royal Thadi</strong>
        <p>Crafted with flavour. Served with warmth.</p>
      </footer>

      <button
        type="button"
        className={`rt-cartbar ${itemCount ? "is-visible" : ""}`}
        onClick={() => setSheet("cart")}
        tabIndex={itemCount ? 0 : -1}
        aria-hidden={!itemCount}
      >
        <span className="rt-cartbar__count">{itemCount}</span>
        <span className="rt-cartbar__label">{itemCount === 1 ? "item" : "items"} · View order</span>
        <strong>₹{subtotal}</strong>
        <ArrowRight size={18} />
      </button>

      <div className={`rt-backdrop ${sheet ? "is-open" : ""}`} onClick={() => setSheet(null)} aria-hidden="true" />

      <aside className={`rt-sheet ${sheet === "cart" ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Your order" aria-hidden={sheet !== "cart"}>
        <div className="rt-sheet__grip" />
        <header className="rt-sheet__head">
          <div>
            <p className="rt-kicker">{table ? `Table ${table}` : "Browse only"}</p>
            <h2>Your order</h2>
          </div>
          <button type="button" className="rt-icon-button" onClick={() => setSheet(null)} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {cartLines.length === 0 ? (
          <div className="rt-sheet__empty">
            <ShoppingBag size={34} />
            <h3>Order खाली है</h3>
            <p>Menu से कुछ स्वादिष्ट चुनें।</p>
          </div>
        ) : (
          <>
            <ul className="rt-cart-lines">
              {cartLines.map((item) => (
                <li className="rt-cart-line" key={item.id}>
                  <div className="rt-cart-line__copy">
                    <strong>{item.name}</strong>
                    <small>₹{item.price} each</small>
                  </div>
                  <QuantityControl item={item} quantity={cart[item.id]} onChange={(amount) => changeQuantity(item.id, amount)} />
                  <span className="rt-cart-line__total">₹{item.price * cart[item.id]}</span>
                </li>
              ))}
            </ul>
            <div className="rt-sheet__footer">
              <label className="rt-note">
                <span>Special request</span>
                <textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} placeholder="Less spicy, no onion…" />
              </label>
              <div className="rt-total">
                <span>Total · {itemCount} {itemCount === 1 ? "item" : "items"}</span>
                <strong>₹{subtotal}</strong>
              </div>
              {table ? (
                <button type="button" className="rt-button rt-button--gold rt-button--block" onClick={placeOrder} disabled={placing}>
                  {placing ? "Sending to kitchen…" : `Place order · Table ${table}`}
                  {!placing && <ArrowRight size={18} />}
                </button>
              ) : (
                <p className="rt-warning">Order भेजने के लिए अपनी table पर लगा QR code scan करें।</p>
              )}
            </div>
          </>
        )}
      </aside>

      <aside
        className={`rt-sheet rt-sheet--compact ${sheet === "service" ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Table service"
        aria-hidden={sheet !== "service"}
      >
        <div className="rt-sheet__grip" />
        <header className="rt-sheet__head">
          <div>
            <p className="rt-kicker">{table ? `Table ${table}` : "Scan your table QR"}</p>
            <h2>How can we help?</h2>
          </div>
          <button type="button" className="rt-icon-button" onClick={() => setSheet(null)} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="rt-service-grid">
          {serviceOptions.map((option) => (
            <button
              type="button"
              key={option.type}
              className="rt-service"
              onClick={() => requestService(option.type)}
              disabled={sendingService !== null}
            >
              <span className="rt-service__icon">
                <option.icon size={24} strokeWidth={1.6} />
              </span>
              <strong lang="hi">{sendingService === option.type ? "भेज रहे हैं…" : option.hindi}</strong>
              <small>{option.title}</small>
            </button>
          ))}
        </div>
      </aside>

      {placedOrder && (
        <div className="rt-confirm" role="dialog" aria-modal="true" aria-labelledby="rt-confirm-title">
          <div className="rt-confirm__card">
            <span className="rt-confirm__seal">
              <Check size={34} strokeWidth={2.4} />
            </span>
            <p className="rt-kicker">Order #{String(placedOrder.id).padStart(3, "0")}</p>
            <h2 id="rt-confirm-title">शुक्रिया! Order भेज दिया गया</h2>
            <p>
              Table {table} · {placedOrder.items} {placedOrder.items === 1 ? "item" : "items"} · ₹{placedOrder.total}
            </p>
            <p className="rt-fine">आपका order kitchen screen पर पहुँच गया है।</p>
            <button type="button" className="rt-button rt-button--gold rt-button--block" onClick={() => setPlacedOrder(null)}>
              Continue
            </button>
          </div>
        </div>
      )}

      <div className={`rt-toast ${toast ? "is-visible" : ""} ${toast?.tone === "error" ? "rt-toast--error" : ""}`} role="status" aria-live="polite">
        {toast && (
          <>
            <span className="rt-toast__icon">{toast.tone === "error" ? <X size={16} /> : <Check size={16} />}</span>
            <div>
              <strong>{toast.title}</strong>
              <small>{toast.detail}</small>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
