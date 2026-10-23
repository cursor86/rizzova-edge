import type { Product, Variant } from "./types";

export const variantLabel = (v: Variant): string => Object.values(v.attributes).join(" / ") || "Standard";

/** The first option axis (e.g. Colour) and its values, for compact selectors on cards. */
export function primaryAxis(p: Product): { name: string; options: { value: string; variant: Variant }[] } | null {
  const name = Object.keys(p.variants[0]?.attributes ?? {})[0];
  if (!name || p.variants.length < 2) return null;
  const seen = new Map<string, Variant>();
  for (const v of p.variants) {
    const value = v.attributes[name];
    if (value && !seen.has(value)) seen.set(value, v);
  }
  return { name, options: [...seen.entries()].map(([value, variant]) => ({ value, variant })) };
}

export const defaultVariant = (p: Product): Variant | undefined => p.variants.find((v) => v.stock > 0) ?? p.variants[0];
