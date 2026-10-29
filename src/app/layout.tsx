import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Manrope, Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import "./globals.css";
import "./dashboard.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"]
});

const royal = Cinzel({ variable: "--font-royal", subsets: ["latin"], weight: ["500", "600", "700"] });

const body = Manrope({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"]
});

const devanagariDisplay = Noto_Serif_Devanagari({
  variable: "--font-devanagari-display",
  subsets: ["devanagari"],
  weight: ["500", "600", "700"]
});

export const metadata: Metadata = {
  title: "The Royal Thadi · Menu & Table Ordering",
  description: "Scan, browse the menu and order from your table at The Royal Thadi, Nausar Ghati, Ajmer.",
  applicationName: "The Royal Thadi"
};

export const viewport: Viewport = {
  themeColor: "#0b0806",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${royal.variable} ${body.variable} ${devanagari.variable} ${devanagariDisplay.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
