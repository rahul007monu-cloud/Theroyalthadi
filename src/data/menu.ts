export type MenuCategory = "Popular" | "Coffee" | "Quick Bites" | "Italian" | "Shakes";

export type MenuItem = {
  id: number;
  name: string;
  hindiName: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  badge?: string;
  rating: number;
  vegetarian: boolean;
};

// Initial editable catalogue for the design prototype. Final names and prices
// should be replaced from the cafe's approved master menu in the admin panel.
export const menuItems: MenuItem[] = [
  {
    id: 1,
    name: "Royal Tandoori Paneer",
    hindiName: "रॉयल तंदूरी पनीर",
    description: "Charred cottage cheese, bell peppers and our house royal marinade.",
    price: 279,
    category: "Popular",
    image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=1200&q=88",
    badge: "Bestseller",
    rating: 4.9,
    vegetarian: true
  },
  {
    id: 2,
    name: "Truffle Garden Pizza",
    hindiName: "ट्रफल गार्डन पिज़्ज़ा",
    description: "Stone-baked crust, garden vegetables, mozzarella and aromatic truffle oil.",
    price: 349,
    category: "Italian",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1200&q=88",
    badge: "Chef's pick",
    rating: 4.8,
    vegetarian: true
  },
  {
    id: 3,
    name: "Velvet Alfredo Pasta",
    hindiName: "वेलवेट अल्फ्रेडो पास्ता",
    description: "Silky parmesan cream, herbs and penne finished with cracked pepper.",
    price: 289,
    category: "Italian",
    image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1200&q=88",
    rating: 4.7,
    vegetarian: true
  },
  {
    id: 4,
    name: "Royal Crunch Burger",
    hindiName: "रॉयल क्रंच बर्गर",
    description: "Crisp signature patty, fresh greens, smoked cheese and house sauce.",
    price: 229,
    category: "Quick Bites",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=88",
    badge: "Popular",
    rating: 4.8,
    vegetarian: true
  },
  {
    id: 5,
    name: "Peri Peri Gold Fries",
    hindiName: "पेरी पेरी गोल्ड फ्राइज़",
    description: "Twice-fried golden potatoes dusted with a warm peri peri blend.",
    price: 179,
    category: "Quick Bites",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=88",
    rating: 4.6,
    vegetarian: true
  },
  {
    id: 6,
    name: "Crown Cold Coffee",
    hindiName: "क्राउन कोल्ड कॉफी",
    description: "Slow-brewed coffee, velvety milk and a cloud of vanilla cream.",
    price: 199,
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1200&q=88",
    badge: "Signature",
    rating: 4.9,
    vegetarian: true
  },
  {
    id: 7,
    name: "Hazelnut Cappuccino",
    hindiName: "हेज़लनट कैपुचीनो",
    description: "Double espresso, textured milk and toasted hazelnut aroma.",
    price: 189,
    category: "Coffee",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=88",
    rating: 4.7,
    vegetarian: true
  },
  {
    id: 8,
    name: "Belgian Chocolate Shake",
    hindiName: "बेल्जियन चॉकलेट शेक",
    description: "Dark Belgian cocoa, premium ice cream and chocolate shards.",
    price: 239,
    category: "Shakes",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=88",
    badge: "Indulgent",
    rating: 4.8,
    vegetarian: true
  }
];

export const categories = ["All", "Popular", "Coffee", "Quick Bites", "Italian", "Shakes"] as const;
