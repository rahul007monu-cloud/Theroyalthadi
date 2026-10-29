"use client";

/* eslint-disable @next/next/no-img-element -- payment QR is generated on demand by our own API. */

import dynamic from "next/dynamic";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Banknote,
  BellRing,
  Check,
  ChefHat,
  ChevronDown,
  Cigarette,
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
  QrCode,
  ReceiptIndianRupee,
  Sandwich,
  Search,
  ShoppingBag,
  Smartphone,
  Soup,
  Star,
  Wheat,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { categoryHindi, foodItems, menuCategories, menuItems, type MenuCategory, type MenuItem } from "@/data/menu";
import type { UpiConfig } from "@/lib/types";
import { buildUpiLink } from "@/lib/upi";

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
  "Lassi House": Milk,
  Cigarettes: Cigarette
};

type Cart = Record<number, number>;
type ServiceType = "WAITER" | "WATER" | "BILL";
type Sheet = "cart" | "service" | "table" | null;
type Toast = { title: string; detail: string; tone: "success" | "error" };
type PlacedOrder = { id: number; table: number; total: number; items: number; payment: "choose" | "UPI" | "COUNTER"; claimed: boolean };

const TABLES = Array.from({ length: 50 }, (_, index) => index + 1);
const pad = (value: number) => String(value).padStart(2, "0");
const MAPS_URL = "https://www.google.com/maps/place/The+royal+thadi/@26.4877447,74.6054583,17z";
const lowestPrice = Math.min(...foodItems.map((item) => item.price));

const serviceOptions: { type: ServiceType; title: string; hindi: string; icon: LucideIcon }[] = [
  { type: "WAITER", title: "Call waiter", hindi: "वेटर बुलाएँ", icon: BellRing },
  { type: "WATER", title: "Water", hindi: "पानी", icon: Droplets },
  { type: "BILL", title: "Bring bill", hindi: "बिल लाएँ", icon: ReceiptIndianRupee }
];

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
        <radialGradient id="rt-poster-chai" cx="0.45" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#6e3a1d" />
          <stop offset="0.7" stopColor="#8f5630" />
          <stop offset="1" stopColor="#c99a6c" />
        </radialGradient>
      </defs>
      <ellipse cx="160" cy="252" rx="114" ry="22" fill="url(#rt-poster-gold)" opacity="0.85" />
      <path d="M94 104 L226 104 L205 236 Q160 252 115 236 Z" fill="url(#rt-poster-clay)" />
      <path d="M102 162 Q160 178 218 162" fill="none" stroke="url(#rt-poster-gold)" strokeWidth="4" />
      <ellipse cx="160" cy="104" rx="68" ry="15" fill="url(#rt-poster-gold)" />
      <ellipse cx="160" cy="105" rx="58" ry="11" fill="url(#rt-poster-chai)" />
    </svg>
  );
}

export function RoyalExperience({ initialTable, upi }: { initialTable: number | null; upi: UpiConfig | null }) {
  const [table, setTable] = useState<number | null>(initialTable);
  const [cart, setCart] = useState<Cart>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MenuCategory>(menuCategories[0]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [afterTablePick, setAfterTablePick] = useState<Sheet>(null);
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sendingService, setSendingService] = useState<ServiceType | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [pendingAdultItem, setPendingAdultItem] = useState<MenuItem | null>(null);
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
  const cartLines = useMemo(() => menuItems.filter((item) => cart[item.id]), [cart]);
  const itemCount = cartLines.reduce((sum, item) => sum + cart[item.id], 0);
  const subtotal = cartLines.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const tableLabel = table ? pad(table) : null;

  const showToast = useCallback((title: string, detail: string, tone: Toast["tone"] = "success") => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ title, detail, tone });
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const applyQuantity = useCallback((id: number, amount: number) => {
    setCart((current) => {
      const nextQuantity = Math.min(20, Math.max(0, (current[id] ?? 0) + amount));
      const next = { ...current, [id]: nextQuantity };
      if (nextQuantity === 0) delete next[id];
      return next;
    });
  }, []);

  function changeQuantity(item: MenuItem, amount: number) {
    if (amount > 0 && item.ageRestricted && !adultConfirmed) {
      setPendingAdultItem(item);
      return;
    }
    applyQuantity(item.id, amount);
  }

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
    const locked = sheet !== null || placedOrder !== null || pendingAdultItem !== null;
    document.body.style.overflow = locked ? "hidden" : "";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSheet(null);
        setPendingAdultItem(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet, placedOrder, pendingAdultItem]);

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

  function openNeedingTable(next: Exclude<Sheet, "table" | null>) {
    if (table) {
      setSheet(next);
    } else {
      setAfterTablePick(next);
      setSheet("table");
    }
  }

  function chooseTable(value: number) {
    setTable(value);
    window.history.replaceState(null, "", `?table=${value}`);
    const next = afterTablePick;
    setAfterTablePick(null);
    setSheet(next);
    showToast(`Table ${pad(value)} चुनी गई`, "अब आपका order इसी table पर आएगा।");
  }

  async function placeOrder() {
    if (!table) {
      setAfterTablePick("cart");
      setSheet("table");
      return;
    }
    if (cartLines.length === 0 || placing) return;
    setPlacing(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: table, note, items: cartLines.map((item) => ({ menuItemId: item.id, quantity: cart[item.id] })) })
      });
      const result = (await response.json().catch(() => ({}))) as { orderId?: number; total?: number; error?: string };
      if (!response.ok || !result.orderId) throw new Error(result.error ?? "कृपया दोबारा कोशिश करें या waiter को बुलाएँ।");
      setPlacedOrder({ id: result.orderId, table, total: result.total ?? subtotal, items: itemCount, payment: "choose", claimed: false });
      setCart({});
      setNote("");
      setSheet(null);
    } catch (error) {
      showToast("Order नहीं जा पाया", error instanceof Error ? error.message : "कृपया दोबारा कोशिश करें।", "error");
    } finally {
      setPlacing(false);
    }
  }

  async function savePayment(method: "UPI" | "COUNTER", claimedPaid = false) {
    if (!placedOrder || savingPayment) return;
    setSavingPayment(true);
    try {
      const response = await fetch(`/api/orders/${placedOrder.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, claimedPaid })
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error ?? "कृपया दोबारा कोशिश करें।");
      }
      setPlacedOrder({ ...placedOrder, payment: method, claimed: claimedPaid || placedOrder.claimed });
      if (claimedPaid) showToast("धन्यवाद!", "Staff आपका payment check करके confirm करेगा।");
    } catch (error) {
      showToast("Payment save नहीं हुआ", error instanceof Error ? error.message : "कृपया दोबारा कोशिश करें।", "error");
    } finally {
      setSavingPayment(false);
    }
  }

  async function requestService(type: ServiceType) {
    const option = serviceOptions.find((item) => item.type === type);
    if (!table || !option) {
      setAfterTablePick("service");
      setSheet("table");
      return;
    }
    setSendingService(type);
    try {
      const response = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber: table, type })
      });
      const result = (await response.json().catch(() => ({}))) as { duplicate?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "कृपया दोबारा कोशिश करें।");
      setSheet(null);
      showToast(`${option.hindi} · Table ${pad(table)}`, result.duplicate ? "आपकी request पहले से staff के पास है।" : "Staff को सूचना भेज दी गई है।");
    } catch (error) {
      showToast("Request नहीं गई", error instanceof Error ? error.message : "कृपया दोबारा कोशिश करें।", "error");
    } finally {
      setSendingService(null);
    }
  }

  const paymentNote = placedOrder ? `Table ${pad(placedOrder.table)} Order ${placedOrder.id}` : "";

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
          <button type="button" className={`rt-table-pill ${table ? "" : "rt-table-pill--empty"}`} onClick={() => setSheet("table")}>
            {tableLabel ? (
              <>
                Table <b>{tableLabel}</b>
              </>
            ) : (
              "Table चुनें"
            )}
            <ChevronDown size={15} />
          </button>
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
        <div className="rt-hero__copy">
          <p className="rt-eyebrow">Nausar Ghati · Ajmer</p>
          <h1>
            <span className="rt-hindi-display" lang="hi">
              पधारो सा
            </span>
            <span className="rt-wordmark">The Royal Thadi</span>
          </h1>
          <ul className="rt-hero__facts">
            <li>
              <Star size={13} fill="currentColor" /> 4.5 Google
            </li>
            <li>{foodItems.length} dishes</li>
            <li>From ₹{lowestPrice}</li>
          </ul>
        </div>
        <div className="rt-hero__stage">
          <div className="rt-hero__halo" aria-hidden="true" />
          <KulladPoster hidden={sceneReady} />
          <KulladScene onReady={() => setSceneReady(true)} onFail={() => setSceneReady(false)} />
        </div>
        <div className="rt-hero__actions">
          <button type="button" className={`rt-button ${table ? "rt-button--ghost" : "rt-button--gold"}`} onClick={() => setSheet("table")}>
            {tableLabel ? `Table ${tableLabel} · बदलें` : "अपनी table चुनें"}
          </button>
          <button type="button" className="rt-button rt-button--ghost" onClick={() => openNeedingTable("service")}>
            <BellRing size={18} /> Service
          </button>
        </div>
      </section>

      <section className="rt-menu" id="menu" aria-label="Menu">
        <label className="rt-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search chai, maggi, cigarette…" aria-label="Search the menu" />
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
              const restricted = items[0]?.ageRestricted;
              return (
                <section
                  key={category}
                  id={sectionId(category)}
                  data-menu-section={category}
                  className={`rt-category ${restricted ? "rt-category--restricted" : ""}`}
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
                      {restricted ? "18+" : items.length}
                    </span>
                  </header>
                  {restricted && (
                    <p className="rt-warning-strip" lang="hi">
                      सिर्फ 18+ के लिए · धूम्रपान स्वास्थ्य के लिए हानिकारक है
                    </p>
                  )}
                  <ul className="rt-items">
                    {items.map((item) => (
                      <li className="rt-item" key={item.id}>
                        {item.vegetarian && (
                          <span className="rt-veg" title="Vegetarian">
                            <i />
                          </span>
                        )}
                        <div className="rt-item__copy">
                          <span className="rt-item__name">{item.name}</span>
                          {item.description && <span className="rt-item__note">{item.description}</span>}
                        </div>
                        <span className="rt-item__leader" aria-hidden="true" />
                        <span className="rt-item__price">₹{item.price}</span>
                        <QuantityControl item={item} quantity={cart[item.id] ?? 0} onChange={(amount) => changeQuantity(item, amount)} />
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

      {/* Table picker */}
      <aside className={`rt-sheet ${sheet === "table" ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Choose your table" aria-hidden={sheet !== "table"}>
        <div className="rt-sheet__grip" />
        <header className="rt-sheet__head">
          <div>
            <p className="rt-kicker">Tables 1 – 50</p>
            <h2>अपनी table चुनें</h2>
          </div>
          <button type="button" className="rt-icon-button" onClick={() => setSheet(null)} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="rt-table-grid">
          {TABLES.map((value) => (
            <button
              type="button"
              key={value}
              className={`rt-table-option ${table === value ? "is-selected" : ""}`}
              onClick={() => chooseTable(value)}
              aria-pressed={table === value}
              aria-label={`Table ${value}`}
            >
              {pad(value)}
            </button>
          ))}
        </div>
      </aside>

      {/* Cart */}
      <aside className={`rt-sheet ${sheet === "cart" ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Your order" aria-hidden={sheet !== "cart"}>
        <div className="rt-sheet__grip" />
        <header className="rt-sheet__head">
          <div>
            <button type="button" className="rt-sheet__table" onClick={() => { setAfterTablePick("cart"); setSheet("table"); }}>
              {tableLabel ? `Table ${tableLabel}` : "Table नहीं चुनी"} · बदलें
            </button>
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
            <p>Menu से कुछ चुनें।</p>
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
                  <QuantityControl item={item} quantity={cart[item.id]} onChange={(amount) => changeQuantity(item, amount)} />
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
                <span>
                  Total · {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
                <strong>₹{subtotal}</strong>
              </div>
              <button type="button" className="rt-button rt-button--gold rt-button--block" onClick={placeOrder} disabled={placing}>
                {placing ? "Sending to kitchen…" : tableLabel ? `Order भेजें · Table ${tableLabel}` : "Table चुनें और order भेजें"}
                {!placing && <ArrowRight size={18} />}
              </button>
            </div>
          </>
        )}
      </aside>

      {/* Service */}
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
            <p className="rt-kicker">{tableLabel ? `Table ${tableLabel}` : "Table चुनें"}</p>
            <h2>How can we help?</h2>
          </div>
          <button type="button" className="rt-icon-button" onClick={() => setSheet(null)} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="rt-service-grid">
          {serviceOptions.map((option) => (
            <button type="button" key={option.type} className="rt-service" onClick={() => requestService(option.type)} disabled={sendingService !== null}>
              <span className="rt-service__icon">
                <option.icon size={24} strokeWidth={1.6} />
              </span>
              <strong lang="hi">{sendingService === option.type ? "भेज रहे हैं…" : option.hindi}</strong>
              <small>{option.title}</small>
            </button>
          ))}
        </div>
      </aside>

      {/* 18+ confirmation for tobacco */}
      {pendingAdultItem && (
        <div className="rt-confirm" role="dialog" aria-modal="true" aria-labelledby="rt-adult-title">
          <div className="rt-confirm__card">
            <span className="rt-confirm__seal rt-confirm__seal--warning">18+</span>
            <h2 id="rt-adult-title">सिर्फ 18+ के लिए</h2>
            <p>Cigarette सिर्फ 18 साल या उससे ज़्यादा उम्र वालों को दी जाती है। धूम्रपान स्वास्थ्य के लिए हानिकारक है।</p>
            <div className="rt-confirm__actions">
              <button type="button" className="rt-button rt-button--ghost" onClick={() => setPendingAdultItem(null)}>
                नहीं
              </button>
              <button
                type="button"
                className="rt-button rt-button--gold"
                onClick={() => {
                  setAdultConfirmed(true);
                  applyQuantity(pendingAdultItem.id, 1);
                  setPendingAdultItem(null);
                }}
              >
                हाँ, मैं 18+ हूँ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order placed + payment */}
      {placedOrder && (
        <div className="rt-confirm" role="dialog" aria-modal="true" aria-labelledby="rt-confirm-title">
          <div className="rt-confirm__card rt-confirm__card--payment">
            <span className="rt-confirm__seal">
              <Check size={32} strokeWidth={2.4} />
            </span>
            <p className="rt-kicker">
              Order #{String(placedOrder.id).padStart(3, "0")} · Table {pad(placedOrder.table)}
            </p>
            <h2 id="rt-confirm-title">Order kitchen में पहुँच गया</h2>
            <div className="rt-pay-amount">
              <span>
                {placedOrder.items} {placedOrder.items === 1 ? "item" : "items"} · Total
              </span>
              <strong>₹{placedOrder.total}</strong>
            </div>

            {placedOrder.payment === "choose" && (
              <>
                <p className="rt-pay-question">Payment कैसे करेंगे?</p>
                <div className="rt-pay-options">
                  {upi && (
                    <button type="button" className="rt-pay-option" onClick={() => savePayment("UPI")} disabled={savingPayment}>
                      <QrCode size={26} />
                      <strong>UPI / QR</strong>
                      <small>अभी pay करें</small>
                    </button>
                  )}
                  <button type="button" className="rt-pay-option" onClick={() => savePayment("COUNTER")} disabled={savingPayment}>
                    <Banknote size={26} />
                    <strong>Cash / Counter</strong>
                    <small>बाद में pay करें</small>
                  </button>
                </div>
                {!upi && <p className="rt-fine">UPI QR जल्द जुड़ेगा। अभी counter पर payment करें।</p>}
              </>
            )}

            {placedOrder.payment === "UPI" && upi && (
              <div className="rt-upi">
                <img
                  src={`/api/upi-qr?amount=${placedOrder.total}&note=${encodeURIComponent(paymentNote)}`}
                  alt={`UPI QR for ₹${placedOrder.total}`}
                  width={240}
                  height={240}
                />
                <p className="rt-upi__payee">
                  {upi.name} · <span>{upi.id}</span>
                </p>
                <a className="rt-button rt-button--gold rt-button--block" href={buildUpiLink(upi, placedOrder.total, paymentNote)}>
                  <Smartphone size={18} /> UPI app से ₹{placedOrder.total} pay करें
                </a>
                <p className="rt-fine">दूसरे phone से QR scan करें, या screenshot लेकर UPI app में “Scan from gallery” से pay करें।</p>
                {placedOrder.claimed ? (
                  <p className="rt-success-line">
                    <Check size={16} /> Staff payment confirm करेगा
                  </p>
                ) : (
                  <button type="button" className="rt-button rt-button--ghost rt-button--block" onClick={() => savePayment("UPI", true)} disabled={savingPayment}>
                    <Check size={18} /> Payment कर दिया
                  </button>
                )}
              </div>
            )}

            {placedOrder.payment === "COUNTER" && (
              <p className="rt-pay-counter">
                <Banknote size={18} /> Bill counter पर pay करें। Bill मंगाने के लिए Service में “बिल लाएँ” दबाएँ।
              </p>
            )}

            <button
              type="button"
              className={`rt-button rt-button--block ${placedOrder.payment === "choose" ? "rt-button--text" : "rt-button--gold"}`}
              onClick={() => setPlacedOrder(null)}
            >
              {placedOrder.payment === "choose" ? "बाद में चुनेंगे" : "Menu पर वापस जाएँ"}
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
