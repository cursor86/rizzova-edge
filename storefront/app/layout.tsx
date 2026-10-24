import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Anton, Instrument_Sans, Instrument_Serif, JetBrains_Mono, Unbounded } from "next/font/google";
import { CartProvider } from "@/context/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", weight: ["500", "700"] });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["500"] });
const poster = Anton({ subsets: ["latin"], variable: "--font-anton", weight: "400" });
const serif = Instrument_Serif({ subsets: ["latin"], variable: "--font-iserif", weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "Rizzova", template: "%s · Rizzova" },
  description: "Home, pets, kids, tech and everyday finds, delivered across Australia and New Zealand.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable} ${mono.variable} ${poster.variable} ${serif.variable}`}>
      <body className="antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-[var(--color-accent-ink)]">
          Skip to content
        </a>
        <CartProvider>
          <SiteHeader />
          <main id="main" className="pb-24">
            {children}
          </main>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
