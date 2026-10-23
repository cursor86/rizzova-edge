"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, ShoppingBag, Sparkles, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatMoney } from "@/lib/money";
import { spring } from "@/lib/tokens";
import { QuantityStepper } from "./quantity-stepper";

const CURRENCY = "AUD";

export function CartSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, totals, setQuantity, remove } = useCart();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            initial={reduce ? { opacity: 0 } : { x: "100%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "100%" }}
            transition={spring.soft}
            className="glass-strong absolute right-0 top-0 flex h-full w-full max-w-md flex-col rounded-l-[var(--radius-panel)] p-5"
          >
            <div className="flex items-center justify-between">
              <h2 id="cart-title" className="font-[family-name:var(--font-display)] text-lg">Your cart</h2>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Close cart" className="glass grid size-10 place-items-center rounded-[var(--radius-control)]">
                <X className="size-5" aria-hidden />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-[var(--color-muted)]">
                <ShoppingBag className="size-10" aria-hidden />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              <ul className="mt-5 flex-1 space-y-3 overflow-y-auto pr-1" aria-label="Cart items">
                {lines.map((l) => (
                  <li key={l.key} className="glass rounded-[var(--radius-card)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/product/${l.productSlug}`} onClick={onClose} className="line-clamp-2 font-medium hover:text-[var(--color-accent)]">{l.title}</Link>
                        <p className="text-xs text-[var(--color-muted)]">{l.variantLabel}</p>
                        {l.bundleRate > 0 && (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-signal)]">
                            <Sparkles className="size-3" aria-hidden /> Bundle −{Math.round(l.bundleRate * 100)}%
                          </p>
                        )}
                        {l.shortBy > 0 && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-danger)]" role="alert">
                            <AlertTriangle className="size-3" aria-hidden /> Only {l.stock} left: reduce by {l.shortBy}
                          </p>
                        )}
                      </div>
                      <button type="button" onClick={() => remove(l.key)} aria-label={`Remove ${l.title}`} className="text-[var(--color-muted)] hover:text-[var(--color-danger)]">
                        <X className="size-4" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <QuantityStepper value={l.quantity} max={Math.min(20, l.stock)} onChange={(q) => setQuantity(l.key, q)} label={l.title} />
                      <span className="font-[family-name:var(--font-mono)] text-sm">{formatMoney(l.lineTotalCents, CURRENCY)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {lines.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                {totals.bundleSavingsCents > 0 && (
                  <div className="flex justify-between text-[var(--color-signal)]">
                    <span>Bundle savings</span>
                    <span className="font-[family-name:var(--font-mono)]">−{formatMoney(totals.bundleSavingsCents, CURRENCY)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="font-[family-name:var(--font-mono)]">{formatMoney(totals.totalCents, CURRENCY)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  aria-disabled={totals.hasStockIssues}
                  className={`btn-brutal mt-2 flex h-12 items-center justify-center ${totals.hasStockIssues ? "pointer-events-none opacity-45" : ""}`}
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
