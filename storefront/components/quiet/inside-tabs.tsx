"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { fromPrice, sectionLabel, shortName } from "./shared";

export interface Shelf { name: string; products: Product[] }

/** Dark "Inside." section: pill tabs switch between category shelves. */
export function InsideTabs({ shelves, section }: { shelves: Shelf[]; section: number }) {
  const [active, setActive] = useState(0);
  const shelf = shelves[active];
  if (!shelf) return null;
  return (
    <section aria-labelledby="inside-h" className="bg-[var(--color-ink)] py-24 sm:py-32">
      <div className="container-x">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">{sectionLabel(section, "Categories")}</p>
        <h2 id="inside-h" className="mt-4 font-[family-name:var(--font-serif)] leading-none" style={{ fontSize: "clamp(3.5rem, 9vw, 8rem)" }}>Inside.</h2>
        <div role="tablist" aria-label="Categories" className="mt-10 flex flex-wrap gap-2">
          {shelves.map((s, n) => (
            <button key={s.name} role="tab" type="button" aria-selected={n === active} onClick={() => setActive(n)} className={`rounded-full border px-4 py-2 text-sm transition-colors ${n === active ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]" : "border-white/20 text-[var(--color-muted)] hover:text-[var(--color-fg)]"}`}>
              {s.name}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul key={shelf.name} role="tabpanel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {shelf.products.slice(0, 4).map((p) => (
              <li key={p.id} className="min-w-0">
                <Link href={`/product/${p.slug}`} className="group block">
                  <span className="block overflow-hidden rounded-3xl bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0]} alt="" loading="lazy" className="aspect-square w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="mt-3 block truncate text-sm">{shortName(p.title, 5)}</span>
                  <span className="block font-[family-name:var(--font-mono)] text-sm text-[var(--color-accent)]">{formatMoney(fromPrice(p), p.currency)}</span>
                </Link>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
        <Link href={`/?q=${encodeURIComponent(shelf.name)}`} className="mt-8 inline-block text-sm text-[var(--color-muted)] underline-offset-4 hover:underline">See all {shelf.name} →</Link>
      </div>
    </section>
  );
}
