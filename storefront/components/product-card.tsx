"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatMoney, stockState } from "@/lib/money";
import { spring } from "@/lib/tokens";
import type { Product } from "@/lib/types";
import { defaultVariant, primaryAxis, variantLabel } from "@/lib/variant";
import { ProductArt } from "./product-art";

export function ProductCard({ product, aspect, index }: { product: Product; aspect: string; index: number }) {
  const { add } = useCart();
  const reduce = useReducedMotion();
  const [variant, setVariant] = useState(defaultVariant(product));
  const [added, setAdded] = useState(false);
  const axis = primaryAxis(product);
  if (!variant) return null;
  const state = stockState(variant.stock);

  const onAdd = () => {
    add({
      variantId: variant.id, productSlug: product.slug, title: product.title, variantLabel: variantLabel(variant),
      unitPriceCents: variant.priceCents, compareAtCents: variant.compareAtCents, stock: variant.stock,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ ...spring.soft, delay: reduce ? 0 : Math.min(index, 8) * 0.04 }}
      whileHover={reduce ? undefined : { y: -4 }}
      className="group glass mb-5 break-inside-avoid overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-glass)] transition-colors hover:border-white/25"
      aria-labelledby={`p-${product.id}-title`}
      itemScope
      itemType="https://schema.org/Product"
    >
      <Link href={`/product/${product.slug}`} tabIndex={-1} aria-hidden>
        <ProductArt src={product.images[0]} alt={product.title} seed={product.id} label={product.category || "Rizzova"} aspect={aspect} isSample={product.isSample} />
      </Link>
      <div className="space-y-3 p-4">
        <h3 id={`p-${product.id}-title`} className="text-[15px] font-semibold leading-snug" itemProp="name">
          <Link href={`/product/${product.slug}`} className="hover:text-[var(--color-accent)]">{product.title}</Link>
        </h3>

        <div className="flex items-baseline gap-2" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <meta itemProp="priceCurrency" content={product.currency} />
          <meta itemProp="price" content={(variant.priceCents / 100).toFixed(2)} />
          <link itemProp="availability" href={state === "out" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"} />
          <span className="font-[family-name:var(--font-mono)] text-lg">{formatMoney(variant.priceCents, product.currency)}</span>
          {variant.compareAtCents && variant.compareAtCents > variant.priceCents && (
            <s className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-muted)]" aria-label={`Was ${formatMoney(variant.compareAtCents, product.currency)}`}>
              {formatMoney(variant.compareAtCents, product.currency)}
            </s>
          )}
        </div>

        {/* Variant selector: shown on hover/focus on desktop, always on touch screens. */}
        {axis && (
          <fieldset className="min-w-0 transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <legend className="sr-only">{axis.name}</legend>
            <div className="flex flex-wrap gap-1.5">
              {axis.options.map(({ value, variant: option }) => {
                const selected = option.id === variant.id;
                const out = option.stock <= 0;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setVariant(option)}
                    aria-pressed={selected}
                    aria-label={`${axis.name}: ${value}${out ? ", sold out" : ""}`}
                    className={`rounded-[var(--radius-chip)] border px-2.5 py-1 text-xs transition-colors ${
                      selected ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-fg)]" : "border-white/15 text-[var(--color-muted)] hover:border-white/40"
                    } ${out ? "line-through opacity-50" : ""}`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className={`text-xs ${state === "out" ? "text-[var(--color-danger)]" : state === "low" ? "text-[var(--color-warn)]" : "text-[var(--color-signal)]"}`}>
            {state === "out" ? "Sold out" : state === "low" ? `Only ${variant.stock} left` : "In stock"}
          </span>
          <button
            type="button"
            onClick={onAdd}
            disabled={state === "out"}
            aria-label={`Add ${product.title}, ${variantLabel(variant)}, to cart`}
            className="btn-brutal relative grid h-10 w-24 place-items-center overflow-hidden text-sm"
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span key="ok" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={spring.snappy} className="flex items-center gap-1">
                  <Check className="size-4" aria-hidden /> Added
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={spring.snappy} className="flex items-center gap-1">
                  <Plus className="size-4" aria-hidden /> Add
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
        <span className="sr-only" aria-live="polite">{added ? `${product.title} added to cart` : ""}</span>
      </div>
    </motion.article>
  );
}
