/**
 * Bundle pricing rules. Mirrors ../../src/lib/bundle.ts in the rizzova-edge Worker, which is the
 * authority at checkout. Keep the two files identical in logic.
 */
export const BUNDLE_MAX_ADDONS = 3;

export function bundleRate(distinctLines: number): number {
  if (distinctLines >= 4) return 0.15;
  if (distinctLines === 3) return 0.1;
  if (distinctLines === 2) return 0.05;
  return 0;
}

export const discountedUnit = (unitCents: number, rate: number): number => unitCents - Math.round(unitCents * rate);

export interface BundleQuote {
  rate: number;
  fullCents: number;
  discountCents: number;
  totalCents: number;
}

/** Quote for an anchor item plus selected add-ons, one unit each. */
export function quoteBundle(unitPrices: number[]): BundleQuote {
  const rate = bundleRate(unitPrices.length);
  const fullCents = unitPrices.reduce((s, p) => s + p, 0);
  const totalCents = unitPrices.reduce((s, p) => s + discountedUnit(p, rate), 0);
  return { rate, fullCents, discountCents: fullCents - totalCents, totalCents };
}

export const newBundleId = (): string => `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
