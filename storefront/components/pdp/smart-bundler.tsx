"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { BUNDLE_MAX_ADDONS, newBundleId, quoteBundle } from "@/lib/bundle";
import { formatMoney } from "@/lib/money";
import { spring } from "@/lib/tokens";
import type { Product, Variant } from "@/lib/types";
import { defaultVariant, variantLabel } from "@/lib/variant";

interface Props {
  anchor: Product;
  anchorVariant: Variant;
  complements: Product[];
}

/**
 * Smart Bundle: the current item plus up to three complementary items, added in one action.
 * Discount tiers come from lib/bundle.ts (the same rules the checkout Worker enforces):
 * 2 items 5%, 3 items 10%, 4 items 15%. Suggestions are rule-based (category, then in-stock items).
 */
export function SmartBundler({ anchor, anchorVariant, complements }: Props) {
  const { addMany } = useCart();
  const reduce = useReducedMotion();
  const options = useMemo(
    () => complements.flatMap((p) => {
      const v = defaultVariant(p);
      return v && v.stock > 0 ? [{ product: p, variant: v }] : [];
    }).slice(0, BUNDLE_MAX_ADDONS),
    [complements],
  );
  const [picked, setPicked] = useState<Set<number>>(() => new Set(options.map((o) => o.variant.id)));
  const [done, setDone] = useState(false);

  if (options.length === 0) return null;
  const chosen = options.filter((o) => picked.has(o.variant.id));
  const anchorAvailable = anchorVariant.stock > 0;
  const quote = quoteBundle([anchorVariant.priceCents, ...chosen.map((o) => o.variant.priceCents)]);

  const toggle = (id: number) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < BUNDLE_MAX_ADDONS) next.add(id);
      return next;
    });

  const addBundle = () => {
    const bundleId = newBundleId();
    const all = [{ product: anchor, variant: anchorVariant }, ...chosen];
    addMany(all.map(({ product, variant }) => ({
      variantId: variant.id, productSlug: product.slug, title: product.title, variantLabel: variantLabel(variant),
      unitPriceCents: variant.priceCents, compareAtCents: variant.compareAtCents, stock: variant.stock, bundleId, quantity: 1,
    })));
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
  };

  return (
    <section aria-labelledby="bundle-h" className="glass rounded-[var(--radius-panel)] border-[var(--color-accent)]/30 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="bundle-h" className="flex items-center gap-2 font-[family-name:var(--font-display)] text-base">
          <Sparkles className="size-4 text-[var(--color-accent)]" aria-hidden /> Smart Bundle
        </h2>
        <span className="rounded-[var(--radius-chip)] bg-[var(--color-signal)]/15 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-signal)]" aria-live="polite">
          {quote.rate > 0 ? `${Math.round(quote.rate * 100)}% off` : "Pick an item"}
        </span>
      </div>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Add up to {BUNDLE_MAX_ADDONS} items: 5% off two, 10% off three, 15% off four.</p>

      <fieldset className="mt-4 min-w-0 space-y-2">
        <legend className="sr-only">Items to bundle with {anchor.title}</legend>
        <div className="flex items-center justify-between rounded-2xl border border-white/10 px-3 py-2.5 text-sm">
          <span className="min-w-0 truncate">This item · {variantLabel(anchorVariant)}</span>
          <span className="font-[family-name:var(--font-mono)]">{formatMoney(anchorVariant.priceCents, anchor.currency)}</span>
        </div>
        {options.map(({ product, variant }) => {
          const checked = picked.has(variant.id);
          const atLimit = !checked && picked.size >= BUNDLE_MAX_ADDONS;
          return (
            <label
              key={variant.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm transition-colors ${checked ? "border-[var(--color-accent)]/70 bg-[var(--color-accent)]/10" : "border-white/10 hover:border-white/30"} ${atLimit ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input type="checkbox" checked={checked} disabled={atLimit} onChange={() => toggle(variant.id)} className="size-4 accent-[var(--color-accent)]" />
              <span className="min-w-0 flex-1 truncate">{product.title}</span>
              <span className="font-[family-name:var(--font-mono)]">{formatMoney(variant.priceCents, product.currency)}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div aria-live="polite">
          {quote.discountCents > 0 && (
            <s className="block font-[family-name:var(--font-mono)] text-xs text-[var(--color-muted)]">{formatMoney(quote.fullCents, anchor.currency)}</s>
          )}
          <span className="font-[family-name:var(--font-mono)] text-xl">{formatMoney(quote.totalCents, anchor.currency)}</span>
          {quote.discountCents > 0 && (
            <span className="ml-2 text-sm text-[var(--color-signal)]">You save {formatMoney(quote.discountCents, anchor.currency)}</span>
          )}
        </div>
        <button type="button" onClick={addBundle} disabled={!anchorAvailable || chosen.length === 0} className="btn-brutal flex h-11 items-center gap-2 px-5 text-sm">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={done ? "done" : "add"} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={spring.snappy} className="flex items-center gap-2">
              {done ? <><Check className="size-4" aria-hidden /> Bundle added</> : `Add ${chosen.length + 1} to cart`}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </section>
  );
}
