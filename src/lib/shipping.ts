/**
 * Delivery zones and options. Mirrored in storefront/lib/shipping.ts; this copy decides the charge at checkout.
 * Express is offered only where suppliers support faster services; confirm per product with
 * aliexpress.ds.freight.query before relying on the 1-week estimate.
 */
/**
 * Express stays off until the catalogue has products with a faster AliExpress service.
 * Checked 24 Oct 2026: the test product offers one AU service only (Cainiao standard, 6–10 days), and none to the US.
 */
export const EXPRESS_ENABLED = false;

export type ShippingMethod = "standard" | "express";

export interface ShippingOption { id: ShippingMethod; label: string; estimate: string; cents: number }

export const SHIPPING_ZONES: Record<string, { name: string; options: ShippingOption[] }> = {
  AU: { name: "Australia", options: [
    { id: "standard", label: "Free delivery", estimate: "2–3 weeks", cents: 0 },
    { id: "express", label: "Express", estimate: "about 1 week", cents: 1500 },
  ] },
  US: { name: "United States", options: [
    { id: "standard", label: "Free delivery", estimate: "2–3 weeks", cents: 0 },
    { id: "express", label: "Express", estimate: "about 1 week", cents: 1500 },
  ] },
  AE: { name: "United Arab Emirates", options: [
    { id: "standard", label: "Standard delivery", estimate: "2–3 weeks", cents: 500 },
    { id: "express", label: "Express", estimate: "about 1 week", cents: 1500 },
  ] },
};

export function shippingOption(country: string, method: unknown): ShippingOption | null {
  const zone = SHIPPING_ZONES[country];
  if (!zone) return null;
  const options = zone.options.filter((o) => EXPRESS_ENABLED || o.id !== "express");
  return options.find((o) => o.id === method) ?? options[0] ?? null;
}
