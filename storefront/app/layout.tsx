import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Instrument_Sans, JetBrains_Mono, Unbounded } from "next/font/google";
import { CartProvider } from "@/context/cart-context";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", weight: ["500", "700"] });
const body = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["500"] });

export const metadata: Metadata = {
  title: { default: "Rizzova", template: "%s · Rizzova" },
  description: "Home, pets, kids, tech and everyday finds, delivered across Australia and New Zealand.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-[var(--color-accent-ink)]">
          Skip to content
        </a>
        <CartProvider>
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
