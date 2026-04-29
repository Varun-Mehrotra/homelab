import type { Metadata } from "next";
import { DM_Serif_Display, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ["400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chelsea's Plate",
  description: "A field guide to chain restaurant menus, filtered by the ingredients your gut would rather skip.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${dmSerifDisplay.variable} ${cormorantGaramond.variable} ${inter.variable}`}>
        <div className="shell">
          <header className="masthead">
            <span className="masthead-brand">Chelsea&apos;s Plate</span>
            <div className="masthead-meta">
              <span>Vol. 1 · No. 04</span>
              <span>Apr. 2026</span>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
