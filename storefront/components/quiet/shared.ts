import type { Product } from "@/lib/types";

/** First few words of a supplier title, for big display type. */
export function shortName(title: string, words = 3): string {
  return title.replace(/[^\p{L}\p{N}\s&'-]/gu, " ").split(/\s+/).filter(Boolean).slice(0, words).join(" ");
}

export const fromPrice = (p: Product): number => Math.min(...p.variants.map((v) => v.priceCents));

/** Short spec lines: real specs first, then variant options. */
export function specLines(p: Product, n = 4): { label: string; value: string }[] {
  const lines = p.specs.slice(0, n).map((s) => ({ label: s.label, value: s.value }));
  const axis = Object.keys(p.variants[0]?.attributes ?? {})[0];
  if (lines.length < n && axis) {
    const values = [...new Set(p.variants.map((v) => v.attributes[axis]).filter(Boolean))];
    if (values.length) lines.push({ label: axis, value: values.slice(0, 3).join(", ") + (values.length > 3 ? ` +${values.length - 3}` : "") });
  }
  return lines.slice(0, n);
}

/** Section label in the "01 / NAME" style. */
export const sectionLabel = (n: number, name: string) => `${String(n).padStart(2, "0")} / ${name}`;
