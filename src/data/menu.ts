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
  /** Only real notes printed on the cafe menu, e.g. tea ingredients. */
  description?: string;
  price: number;
  category: MenuCategory;
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
    ["Paneer Cheese Sandwich", 90],
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
    ["Mix Veg Soup", 40]
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

export const menuCategories = Object.keys(catalogue) as MenuCategory[];

export const categoryHindi: Record<MenuCategory, string> = {
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

/** Items shown in the "Royal picks" rail. The owner can change this list. */
export const royalPickNames = [
  "Masala Tea (Kullad)",
  "Paneer Cheese Maggi",
  "Chilli Paneer",
  "Paneer Cheese Pizza",
  "Cold Coffee Special",
  "Mojito"
] as const;

export const menuItems: MenuItem[] = menuCategories
  .flatMap((category) =>
    catalogue[category].map(([name, price, note]) => ({
      id: 0,
      name,
      description: note,
      price,
      category,
      vegetarian: true
    }))
  )
  .map((item, index) => ({ ...item, id: index + 1 }));
