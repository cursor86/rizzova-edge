"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import { bundleRate, discountedUnit } from "@/lib/bundle";
import { stockState } from "@/lib/money";
import type { StockState } from "@/lib/types";

export interface CartLine {
  variantId: number;
  productSlug: string;
  title: string;
  variantLabel: string;
  unitPriceCents: number;
  compareAtCents: number | null;
  stock: number;
  quantity: number;
  bundleId?: string;
}

export interface PricedLine extends CartLine {
  key: string;
  bundleRate: number;
  effectiveUnitCents: number;
  lineTotalCents: number;
  stockState: StockState;
  /** Units requested beyond what is in stock, counted across every line holding this variant. */
  shortBy: number;
}

export interface CartTotals {
  itemCount: number;
  subtotalCents: number;      // before bundle discounts
  bundleSavingsCents: number;
  totalCents: number;
  hasStockIssues: boolean;
}

type AddInput = Omit<CartLine, "quantity"> & { quantity?: number };

type Action =
  | { type: "add"; line: AddInput }
  | { type: "addMany"; lines: AddInput[] }
  | { type: "setQuantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "refreshStock"; stock: Record<number, number> }
  | { type: "clear" }
  | { type: "hydrate"; lines: CartLine[] };

const MAX_QTY = 20;
const STORAGE_KEY = "rz-cart-v1";

export const lineKey = (l: Pick<CartLine, "variantId" | "bundleId">): string => `${l.variantId}:${l.bundleId ?? ""}`;
const clampQty = (q: number, stock: number): number => Math.max(0, Math.min(MAX_QTY, stock, Math.floor(q)));

function addLine(lines: CartLine[], input: AddInput): CartLine[] {
  const key = lineKey(input);
  const existing = lines.find((l) => lineKey(l) === key);
  const wanted = (existing?.quantity ?? 0) + (input.quantity ?? 1);
  const quantity = clampQty(wanted, input.stock);
  if (quantity === 0) return lines;
  const next: CartLine = { ...input, quantity };
  return existing ? lines.map((l) => (lineKey(l) === key ? next : l)) : [...lines, next];
}

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "add":
      return addLine(state, action.line);
    case "addMany":
      return action.lines.reduce(addLine, state);
    case "setQuantity":
      return state.flatMap((l) => {
        if (lineKey(l) !== action.key) return [l];
        const quantity = clampQty(action.quantity, l.stock);
        return quantity > 0 ? [{ ...l, quantity }] : [];
      });
    case "remove":
      return state.filter((l) => lineKey(l) !== action.key);
    case "refreshStock":
      return state.map((l) => {
        const stock = action.stock[l.variantId];
        return stock === undefined ? l : { ...l, stock };
      });
    case "clear":
      return [];
    case "hydrate":
      return action.lines;
  }
}

/** Pure pricing: bundle rates by distinct lines per bundle, and stock checked per variant across lines. */
export function priceCart(lines: CartLine[]): { lines: PricedLine[]; totals: CartTotals } {
  const bundleSizes = new Map<string, number>();
  const wantedByVariant = new Map<number, number>();
  for (const l of lines) {
    if (l.bundleId) bundleSizes.set(l.bundleId, (bundleSizes.get(l.bundleId) ?? 0) + 1);
    wantedByVariant.set(l.variantId, (wantedByVariant.get(l.variantId) ?? 0) + l.quantity);
  }
  const priced: PricedLine[] = lines.map((l) => {
    const rate = l.bundleId ? bundleRate(bundleSizes.get(l.bundleId) ?? 1) : 0;
    const effectiveUnitCents = discountedUnit(l.unitPriceCents, rate);
    const wanted = wantedByVariant.get(l.variantId) ?? l.quantity;
    return {
      ...l,
      key: lineKey(l),
      bundleRate: rate,
      effectiveUnitCents,
      lineTotalCents: effectiveUnitCents * l.quantity,
      stockState: stockState(l.stock),
      shortBy: Math.max(0, wanted - l.stock),
    };
  });
  const subtotalCents = priced.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const totalCents = priced.reduce((s, l) => s + l.lineTotalCents, 0);
  return {
    lines: priced,
    totals: {
      itemCount: priced.reduce((s, l) => s + l.quantity, 0),
      subtotalCents,
      bundleSavingsCents: subtotalCents - totalCents,
      totalCents,
      hasStockIssues: priced.some((l) => l.shortBy > 0 || l.stockState === "out"),
    },
  };
}

interface CartContextValue {
  lines: PricedLine[];
  totals: CartTotals;
  add: (line: AddInput) => void;
  addMany: (lines: AddInput[]) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  refreshStock: (stock: Record<number, number>) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function isCartLine(v: unknown): v is CartLine {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.variantId === "number" && typeof o.title === "string" && typeof o.unitPriceCents === "number"
    && typeof o.quantity === "number" && typeof o.stock === "number" && typeof o.productSlug === "string";
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, []);

  // The cart is a per-browser convenience; the server re-prices everything at checkout.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) dispatch({ type: "hydrate", lines: parsed.filter(isCartLine) });
    } catch {
      /* storage unavailable: start empty */
    }
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  const add = useCallback((line: AddInput) => dispatch({ type: "add", line }), []);
  const addMany = useCallback((lines: AddInput[]) => dispatch({ type: "addMany", lines }), []);
  const setQuantity = useCallback((key: string, quantity: number) => dispatch({ type: "setQuantity", key, quantity }), []);
  const remove = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const refreshStock = useCallback((stock: Record<number, number>) => dispatch({ type: "refreshStock", stock }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(() => {
    const { lines, totals } = priceCart(state);
    return { lines, totals, add, addMany, setQuantity, remove, refreshStock, clear };
  }, [state, add, addMany, setQuantity, remove, refreshStock, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
