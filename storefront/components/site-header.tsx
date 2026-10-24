"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { spring } from "@/lib/tokens";
import { SearchBar } from "./search-bar";
import { CartSheet } from "./cart-sheet";

export function SiteHeader() {
  const { totals } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const reduce = useReducedMotion();
  const count = totals.itemCount;

  return (
    <>
      <header className="glass-strong sticky top-0 z-40 border-x-0 border-t-0">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Rizzova home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-mark.png" alt="" width={36} height={36} className="size-9" />
            <span className="hidden font-[family-name:var(--font-serif)] text-xl uppercase tracking-[0.28em] text-[var(--color-accent)] sm:inline">Rizzova</span>
          </Link>
          <nav aria-label="Primary" className="hidden gap-5 text-sm text-[var(--color-muted)] md:flex">
            {["home", "pets", "kids", "tech", "fashion"].map((c) => (
              <Link key={c} href={`/?q=${c}`} className="capitalize transition-colors hover:text-[var(--color-fg)]">
                {c}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-3">
            <Suspense fallback={<div className="glass h-11 w-[220px] max-w-full rounded-[var(--radius-control)]" aria-hidden />}>
              <SearchBar />
            </Suspense>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
              aria-haspopup="dialog"
              aria-expanded={cartOpen}
              className="glass relative grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] transition-colors hover:border-[var(--color-accent)]"
            >
              <ShoppingBag className="size-5" aria-hidden />
              <AnimatePresence initial={false}>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={reduce ? false : { scale: 0.4, opacity: 0, y: 4 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={spring.pop}
                    className="absolute -right-2 -top-2 grid min-w-6 place-items-center rounded-[var(--radius-chip)] border-2 border-[var(--color-ink)] bg-[var(--color-accent)] px-1.5 font-[family-name:var(--font-mono)] text-xs font-bold text-[var(--color-accent-ink)]"
                    aria-hidden
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>
      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
