export interface Variant {
  id: number;
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  attributes: Record<string, string>;
}

export interface Spec {
  group: string;
  label: string;
  value: string;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  currency: string;
  category: string;
  images: string[];
  variants: Variant[];
  specs: Spec[];
  /** True for demo catalogue entries shown when no backend is configured. */
  isSample: boolean;
}

export type StockState = "in_stock" | "low" | "out";

export interface ShippingAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: "AU" | "NZ";
}
