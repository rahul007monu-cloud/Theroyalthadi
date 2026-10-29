export type MenuCategory =
  | "Maggi House"
  | "Snacks"
  | "Pizza House"
  | "Paratha House"
  | "Pasta House"
  | "Thadi Special"
  | "Tea House"
  | "Coffee Special"
  | "Shakes"
  | "Smoothie"
  | "Soup"
  | "Cocktails"
  | "Lassi House";

export type MenuItem = {
  id: number;
  name: string;
  hindiName: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  badge?: string;
  vegetarian: boolean;
};

type MenuEntry = readonly [name: string, price: number, note?: string];

const catalogue: Record<MenuCategory, readonly MenuEntry[]> = {
  "Maggi House": [
    ["Maggi", 40],
    ["Masala Maggi", 60],
    ["Veg Maggi", 60],
    ["Paneer Maggi", 80],
    ["Cheese Maggi", 80],
    ["Paneer Cheese Maggi", 90]
  ],
  Snacks: [
    ["Bread Butter", 20],
    ["Veg Sandwich", 50],
    ["Aloo Cheese Sandwich", 60],
    ["Paneer Cheese Sandwich", 70],
    ["Garlic Cheese Bread", 50],
    ["Burger", 50],
    ["Veg Burger", 60],
    ["Veg with Cheese Burger", 70],
    ["Chilli Paneer", 150],
    ["Manchurian", 130],
    ["Chowmine", 80],
    ["Chowmine with Manchurian", 160],
    ["French Fries", 120],
    ["Chilli French Fries", 150],
    ["Paneer & Cheese Roll", 120],
    ["Aloo Franki Roll", 80],
    ["Veg Cheese Roll", 80],
    ["Paneer Pakoda", 150],
    ["Mix Pakoda", 130],
    ["Aloo Pyaj Pakoda", 100],
    ["Bread Aloo Roll", 80],
    ["Bread Paneer Roll", 120]
  ],
  "Pizza House": [
    ["Veg Cheese Pizza", 140],
    ["Paneer Cheese Pizza", 150],
    ["Onion Capsicum Pizza", 140]
  ],
  "Paratha House": [
    ["Aloo Paratha", 60],
    ["Paneer Paratha", 100],
    ["Aloo Pyaj Paratha", 60],
    ["Mix Veg Paratha", 60],
    ["Cheese Paratha", 100]
  ],
  "Pasta House": [
    ["Red Pasta", 120],
    ["White Pasta", 120],
    ["Red Cheese Pasta", 140],
    ["White Cheese Pasta", 140],
    ["Red White Mix Pasta", 120]
  ],
  "Thadi Special": [
    ["Mojito", 40],
    ["Aam Panna", 20],
    ["Nimbu Panna", 20]
  ],
  "Tea House": [
    ["Masala Tea", 20, "Ginger, cardamom and clove"],
    ["Masala Tea (Kullad)", 30],
    ["Saffron Tea", 40],
    ["Ice Tea", 40, "Ice, mint and lemon"],
    ["Black Lemon Tea", 40],
    ["Green Lemon Tea", 40]
  ],
  "Coffee Special": [
    ["Hot Coffee", 30],
    ["Black Coffee", 30],
    ["Cold Coffee", 50],
    ["Cold Coffee Special", 60]
  ],
  Shakes: [
    ["Mango Shake", 80],
    ["Strawberry Shake", 80],
    ["Chocolate Shake", 80],
    ["Pan Masala Shake", 80]
  ],
  Smoothie: [
    ["Mango Smoothie", 70],
    ["Orange Smoothie", 70],
    ["Mango & Orange Smoothie", 70],
    ["Cola Smoothie", 70]
  ],
  Soup: [
    ["Tomato Soup", 40],
    ["Veg Manchow Soup", 40],
    ["Veg Sweet Corn Soup", 40],
    ["Hot N Sour Soup", 40],
    ["Mix Veg Soup", 50]
  ],
  Cocktails: [
    ["Golden Wine", 40],
    ["Blood Orange", 40]
  ],
  "Lassi House": [
    ["Plain Lassi", 30],
    ["Makhaniya Lassi", 40],
    ["Masala Chhachh", 30]
  ]
};

const categoryOrder = Object.keys(catalogue) as MenuCategory[];

export const categories = ["All", ...categoryOrder] as const;

const categoryHindi: Record<MenuCategory, string> = {
  "Maggi House": "मैगी हाउस",
  Snacks: "स्नैक्स",
  "Pizza House": "पिज़्ज़ा हाउस",
  "Paratha House": "पराठा हाउस",
  "Pasta House": "पास्ता हाउस",
  "Thadi Special": "थड़ी स्पेशल",
  "Tea House": "चाय हाउस",
  "Coffee Special": "कॉफी स्पेशल",
  Shakes: "शेक्स",
  Smoothie: "स्मूदी",
  Soup: "सूप",
  Cocktails: "कॉकटेल",
  "Lassi House": "लस्सी हाउस"
};

const categoryImages: Record<MenuCategory, string> = {
  "Maggi House": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=88",
  Snacks: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=88",
  "Pizza House": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=88",
  "Paratha House": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=88",
  "Pasta House": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=88",
  "Thadi Special": "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=88",
  "Tea House": "https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=1200&q=88",
  "Coffee Special": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=88",
  Shakes: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=88",
  Smoothie: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=1200&q=88",
  Soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=88",
  Cocktails: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=88",
  "Lassi House": "https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=1200&q=88"
};

const highlightedItems: Record<string, string> = {
  "Paneer Cheese Maggi": "House special",
  "Chilli Paneer": "Popular",
  "Paneer Cheese Pizza": "Popular",
  Mojito: "Thadi special",
  "Cold Coffee Special": "Signature",
  "Makhaniya Lassi": "Classic"
};

export const menuItems: MenuItem[] = categoryOrder.flatMap((category) =>
  catalogue[category].map(([name, price, note]) => ({
    id: 0,
    name,
    hindiName: categoryHindi[category],
    description: note ?? `From The Royal Thadi's ${category} selection.`,
    price,
    category,
    image: categoryImages[category],
    badge: highlightedItems[name],
    vegetarian: true
  }))
).map((item, index) => ({ ...item, id: index + 1 }));
