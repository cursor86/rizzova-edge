/**
 * Bundle pricing rules. Shared contract with storefront/lib/bundle.ts – keep both files identical in logic.
 * A bundle is cart lines sharing a bundleId. The discount rate depends on how many distinct lines remain
 * in the bundle and applies to every unit on those lines.
 */
export const BUNDLE_MAX_ADDONS = 3;

export function bundleRate(distinctLines: number): number {
  if (distinctLines >= 4) return 0.15;
  if (distinctLines === 3) return 0.1;
  if (distinctLines === 2) return 0.05;
  return 0;
}

/** Discounted unit price in cents (rounded to the nearest cent). */
export const discountedUnit = (unitCents: number, rate: number) => unitCents - Math.round(unitCents * rate);

export const isValidBundleId = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9-]{1,40}$/.test(v);
