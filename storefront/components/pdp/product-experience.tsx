"use client";

import { useState } from "react";
import { Check, RotateCcw, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatMoney, stockState } from "@/lib/money";
import type { Product, Variant } from "@/lib/types";
import { defaultVariant, variantLabel } from "@/lib/variant";
import { QuantityStepper } from "../quantity-stepper";
import { SmartBundler } from "./smart-bundler";

/** Variant matrix + purchase box + bundler. Variant choice is shared so the bundle anchors on the selected option. */
export function ProductExperience({ product, complements }: { product: Product; complements: Product[] }) {
  const { add } = useCart();
  const [variant, setVariant] = useState<Variant | undefined>(defaultVariant(product));
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  if (!variant) return null;

  const axes = Object.keys(product.variants[0]?.attributes ?? {});
  const state = stockState(variant.stock);

  /** Choose the variant matching the current selection with one axis changed (falls back to any match). */
  const pick = (axis: string, value: string) => {
    const want = { ...variant.attributes, [axis]: value };
    const exact = product.variants.find((v) => Object.entries(want).every(([k, val]) => v.attributes[k] === val));
    const next = exact ?? product.variants.find((v) => v.attributes[axis] === value);
    if (next) {
      setVariant(next);
      setQty((q) => Math.max(1, Math.min(q, next.stock || 1)));
    }
  };

  const onAdd = () => {
    add({
      variantId: variant.id, productSlug: product.slug, title: product.title, variantLabel: variantLabel(variant),
      unitPriceCents: variant.priceCents, compareAtCents: variant.compareAtCents, stock: variant.stock, quantity: qty,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="space-y-5">
      <section aria-labelledby="buy-h" className="glass rounded-[var(--radius-panel)] p-5">
        <h2 id="buy-h" className="sr-only">Choose options and buy</h2>
        <div className="flex items-baseline gap-3">
          <span className="font-[family-name:var(--font-mono)] text-3xl">{formatMoney(variant.priceCents, product.currency)}</span>
          {variant.compareAtCents && variant.compareAtCents > variant.priceCents && (
            <s className="font-[family-name:var(--font-mono)] text-[var(--color-muted)]">{formatMoney(variant.compareAtCents, product.currency)}</s>
          )}
        </div>

        {axes.map((axis) => {
          const values = [...new Set(product.variants.map((v) => v.attributes[axis]).filter((x): x is string => !!x))];
          if (values.length < 2) return null;
          return (
            <fieldset key={axis} className="mt-5 min-w-0">
              <legend className="mb-2 text-sm text-[var(--color-muted)]">
                {axis}: <span className="text-[var(--color-fg)]">{variant.attributes[axis]}</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const selected = variant.attributes[axis] === value;
                  const available = product.variants.some((v) => v.attributes[axis] === value && v.stock > 0);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => pick(axis, value)}
                      aria-pressed={selected}
                      aria-label={`${axis} ${value}${available ? "" : ", sold out"}`}
                      className={`rounded-[var(--radius-control)] border-2 px-3.5 py-2 text-sm transition-[transform,colors] active:translate-y-0.5 ${
                        selected ? "border-[var(--color-accent)] shadow-[var(--shadow-brutal-sm)]" : "border-white/15 hover:border-white/40"
                      } ${available ? "" : "line-through opacity-50"}`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <p className={`mt-5 text-sm ${state === "out" ? "text-[var(--color-danger)]" : state === "low" ? "text-[var(--color-warn)]" : "text-[var(--color-signal)]"}`} aria-live="polite">
          {state === "out" ? "Sold out in this option" : state === "low" ? `Only ${variant.stock} left` : "In stock, ready to order"}
        </p>

        <div className="mt-4 flex items-center gap-3">
          <QuantityStepper value={qty} max={Math.min(20, variant.stock)} onChange={(q) => setQty(Math.max(1, Math.min(q, variant.stock)))} label={product.title} />
          <button type="button" onClick={onAdd} disabled={state === "out"} className="btn-brutal flex h-12 flex-1 items-center justify-center gap-2">
            {added ? <><Check className="size-5" aria-hidden /> Added to cart</> : <><ShoppingBag className="size-5" aria-hidden /> Add to cart</>}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">{added ? `${qty} ${product.title} added to cart` : ""}</span>

        <ul className="mt-5 grid gap-2 text-sm text-[var(--color-muted)]">
          <li className="flex items-center gap-2"><Truck className="size-4" aria-hidden /> Free delivery to Australia and the US · UAE A$5</li>
          <li className="flex items-center gap-2"><ShieldCheck className="size-4" aria-hidden /> Secure payment by Stripe</li>
          <li className="flex items-center gap-2"><RotateCcw className="size-4" aria-hidden /> See our returns policy before you buy</li>
        </ul>
      </section>

      <SmartBundler anchor={product} anchorVariant={variant} complements={complements} />
    </div>
  );
}
