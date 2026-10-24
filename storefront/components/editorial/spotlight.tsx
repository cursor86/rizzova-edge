"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { variantLabel } from "@/lib/variant";

/** Big-type product spotlight: oversized word drifts behind the product, with a floating add-to-bag bar. */
export function Spotlight({ product, index = 1 }: { product: Product; index?: number }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const wordX = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["12%", "-22%"]);
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [40, -40]);
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const variant = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const word = product.title.split(/\s+/).filter((w) => /^[a-z]/i.test(w)).slice(0, 2).join(" ").slice(0, 16) || "Rizzova";

  const onAdd = () => {
    if (!variant) return;
    add({ variantId: variant.id, productSlug: product.slug, title: product.title, variantLabel: variantLabel(variant), unitPriceCents: variant.priceCents, compareAtCents: variant.compareAtCents, stock: variant.stock });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <section ref={ref} aria-labelledby={`spot-${product.id}`} className="relative overflow-hidden bg-[var(--color-sage)] text-[var(--color-fg)]">
      <motion.p
        aria-hidden
        style={{ x: wordX }}
        className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 whitespace-nowrap font-[family-name:var(--font-poster)] uppercase leading-none text-[var(--color-accent)]/15"
      >
        <span style={{ fontSize: "clamp(7rem, 24vw, 22rem)" }}>{word}</span>
      </motion.p>

      <div className="container-x relative grid min-h-[640px] items-center gap-8 py-16 md:grid-cols-[1fr_auto_1fr]">
        <div className="max-w-xs">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em]">Spotlight / {String(index).padStart(2, "0")}</p>
          <h2 id={`spot-${product.id}`} className="mt-3 text-2xl font-bold leading-tight">{product.title}</h2>
          {product.description && <p className="mt-3 line-clamp-4 font-[family-name:var(--font-serif)] text-lg italic leading-snug">{product.description}</p>}
        </div>

        <motion.div style={{ y: imgY }} className="mx-auto w-[min(420px,82vw)]">
          <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-[var(--radius-panel)] bg-white shadow-[0_40px_80px_-30px_rgb(0_0_0/0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.images[0]} alt={product.title} loading="lazy" className="aspect-square w-full object-cover" />
          </Link>
        </motion.div>

        <div className="md:justify-self-end">
          {variant && (
            <div className="flex items-center gap-3 rounded-[var(--radius-control)] border-2 border-[var(--color-accent)] bg-[var(--color-ink)] p-2 pl-4 shadow-[5px_5px_0_0_var(--color-accent)]">
              <div className="min-w-0">
                <p className="max-w-40 truncate text-sm font-semibold">{variantLabel(variant) === "Standard" ? "Add to your bag" : variantLabel(variant)}</p>
                <p className="font-[family-name:var(--font-mono)] text-sm">
                  {formatMoney(variant.priceCents, product.currency)}
                  {variant.compareAtCents && variant.compareAtCents > variant.priceCents && (
                    <s className="ml-2 text-[var(--color-muted)]">{formatMoney(variant.compareAtCents, product.currency)}</s>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onAdd}
                disabled={variant.stock <= 0}
                aria-label={`Add ${product.title} to bag`}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-accent-ink)] transition-transform active:scale-95 disabled:opacity-40"
              >
                {added ? <><Check className="size-4" aria-hidden /> Added</> : <><ShoppingBag className="size-4" aria-hidden /> Add to bag</>}
              </button>
            </div>
          )}
          <span className="sr-only" aria-live="polite">{added ? `${product.title} added to bag` : ""}</span>
        </div>
      </div>
    </section>
  );
}
