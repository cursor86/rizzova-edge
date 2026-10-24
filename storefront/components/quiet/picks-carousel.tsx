"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { variantLabel } from "@/lib/variant";
import { fromPrice, sectionLabel, shortName, specLines } from "./shared";

const DOTS = ["#d9b45a", "#b9a3e3", "#8fd3bf"];

/** "01 / The picks": one product at a time, big serif name, a short spec list and a pager. */
export function PicksCarousel({ products, section }: { products: Product[]; section: number }) {
  const [i, setI] = useState(0);
  const [added, setAdded] = useState(false);
  const reduce = useReducedMotion();
  const { add } = useCart();
  const p = products[i];
  if (!p) return null;
  const variant = p.variants.find((v) => v.stock > 0) ?? p.variants[0];

  const onAdd = () => {
    if (!variant) return;
    add({ variantId: variant.id, productSlug: p.slug, title: p.title, variantLabel: variantLabel(variant), unitPriceCents: variant.priceCents, compareAtCents: variant.compareAtCents, stock: variant.stock });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <section aria-labelledby="picks-h" aria-roledescription="carousel" className="bg-[var(--color-ink)] py-24 text-[var(--color-fg)] sm:py-32">
      <div className="container-x">
        <div className="flex items-baseline justify-between border-b border-white/15 pb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em]">
          <h2 id="picks-h">{sectionLabel(section, "Three picks")}</h2>
          <span aria-live="polite">{i + 1} / {products.length}</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.id}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 pt-12 md:grid-cols-2"
          >
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">RZ.0{i + 1} · {p.category || "Rizzova"}</p>
              <h3 className="mt-4 flex items-center gap-4 font-[family-name:var(--font-serif)] leading-[0.95]" style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
                {shortName(p.title)}
                <span aria-hidden className="size-4 shrink-0 rounded-full" style={{ background: DOTS[i % DOTS.length] }} />
              </h3>
              <p className="mt-3 font-[family-name:var(--font-serif)] text-xl italic text-[var(--color-muted)]">From {formatMoney(fromPrice(p), p.currency)} · free delivery to AU &amp; US</p>
              <dl className="mt-8 divide-y divide-white/10 border-y border-white/10 text-sm">
                {specLines(p).map((s) => (
                  <div key={s.label} className="flex justify-between gap-6 py-2.5">
                    <dt className="text-[var(--color-muted)]">{s.label}</dt>
                    <dd className="min-w-0 truncate text-right font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" onClick={onAdd} disabled={!variant || variant.stock <= 0} className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-accent-ink)] disabled:opacity-40">
                  {added ? <><Check className="size-4" aria-hidden /> Added</> : "Add to bag"}
                </button>
                <Link href={`/product/${p.slug}`} className="inline-flex h-12 items-center gap-1.5 rounded-full border border-[var(--color-accent)]/60 px-6 text-[var(--color-accent)] text-sm font-semibold">
                  Details <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>
            <div className="relative grid place-items-center">
              <span aria-hidden className="absolute inset-[8%] rounded-full blur-3xl" style={{ background: `${DOTS[i % DOTS.length]}55` }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[0]} alt={p.title} className="relative aspect-square w-full max-w-md rounded-full bg-white object-contain p-[10%] ring-2 ring-[var(--color-accent)]/50" />
            </div>
          </motion.div>
        </AnimatePresence>
        <div role="tablist" aria-label="Choose a pick" className="mt-12 flex gap-6 font-[family-name:var(--font-mono)] text-sm">
          {products.map((x, n) => (
            <button key={x.id} role="tab" type="button" aria-selected={n === i} aria-label={`Pick ${n + 1}: ${x.title}`} onClick={() => setI(n)} className={`border-b-2 pb-1 transition-colors ${n === i ? "border-current" : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)]"}`}>
              0{n + 1}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
