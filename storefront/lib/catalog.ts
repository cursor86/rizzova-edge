import "server-only";
import type { Product, Spec, Variant } from "./types";

/**
 * Catalogue access for server components. Reads from the rizzova-edge Worker when RIZZOVA_API_URL is set;
 * otherwise serves a small, clearly labelled sample catalogue so the storefront can be previewed.
 */
const API = process.env.RIZZOVA_API_URL?.replace(/\/$/, "") ?? "";
const REVALIDATE_SECONDS = 60;

interface ApiListItem { slug: string }
interface ApiList { items: ApiListItem[]; nextCursor: string | null }
interface ApiVariant {
  id: number; sku: string; price_cents: number; compare_at_price_cents: number | null; stock_qty: number; attributes: Record<string, string>;
}
interface ApiDetail {
  id: number; slug: string; title: string; description: string | null; currency: string;
  variants: ApiVariant[]; images: { url: string; variantId: number | null; feature: boolean }[];
}

function specsFromVariants(variants: Variant[]): Spec[] {
  const options = new Map<string, Set<string>>();
  for (const v of variants) for (const [k, val] of Object.entries(v.attributes)) {
    const set = options.get(k) ?? new Set<string>();
    set.add(val);
    options.set(k, set);
  }
  const specs: Spec[] = [...options.entries()].map(([label, vals]) => ({ group: "Options", label, value: [...vals].join(", ") }));
  specs.push({ group: "Fulfilment", label: "Dispatch", value: "Ships from our supplier's warehouse" });
  specs.push({ group: "Fulfilment", label: "Tracking", value: "Tracking number emailed once dispatched" });
  return specs;
}

function fromApi(d: ApiDetail): Product {
  const variants: Variant[] = d.variants.map((v) => ({
    id: v.id, sku: v.sku, priceCents: v.price_cents, compareAtCents: v.compare_at_price_cents, stock: v.stock_qty, attributes: v.attributes,
  }));
  return {
    id: d.id, slug: d.slug, title: d.title, description: d.description, currency: d.currency, category: "",
    images: d.images.filter((i) => i.variantId === null).map((i) => i.url), variants, specs: specsFromVariants(variants), isSample: false,
  };
}

async function api<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: REVALIDATE_SECONDS } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function listProducts(query?: string): Promise<Product[]> {
  if (!API) return filterSample(query);
  const qs = new URLSearchParams({ limit: "24" });
  if (query) qs.set("q", query);
  const list = await api<ApiList>(`/api/products?${qs.toString()}`);
  if (!list) return [];
  const details = await Promise.all(list.items.map((i) => api<ApiDetail>(`/api/products/${encodeURIComponent(i.slug)}`)));
  return details.filter((d): d is ApiDetail => d !== null).map(fromApi);
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!API) return SAMPLE.find((p) => p.slug === slug) ?? null;
  const d = await api<ApiDetail>(`/api/products/${encodeURIComponent(slug)}`);
  return d ? fromApi(d) : null;
}

/** Up to `limit` in-stock products to offer alongside `product` (same category first). */
export async function getComplements(product: Product, limit = 3): Promise<Product[]> {
  const pool = await listProducts();
  const inStock = (p: Product) => p.id !== product.id && p.variants.some((v) => v.stock > 0);
  const same = pool.filter((p) => inStock(p) && product.category !== "" && p.category === product.category);
  const rest = pool.filter((p) => inStock(p) && !same.includes(p));
  return [...same, ...rest].slice(0, limit);
}

export const isSampleMode = (): boolean => !API;

// ─────────────── Sample catalogue (preview only, never sold) ───────────────
function v(id: number, sku: string, price: number, stock: number, attributes: Record<string, string>, compareAt: number | null = null): Variant {
  return { id, sku, priceCents: price, compareAtCents: compareAt, stock, attributes };
}
function sample(id: number, slug: string, title: string, category: string, description: string, variants: Variant[], extra: Spec[] = []): Product {
  return { id, slug, title, description, currency: "AUD", category, images: [], variants, specs: [...extra, ...specsFromVariants(variants)], isSample: true };
}

const SAMPLE: Product[] = [
  sample(1, "sample-insulated-tumbler", "Insulated Tumbler 40oz", "home", "Double-wall stainless steel tumbler with handle and straw.", [
    v(101, "SMP-101", 3499, 24, { Colour: "Graphite" }, 4499), v(102, "SMP-102", 3499, 3, { Colour: "Sand" }, 4499), v(103, "SMP-103", 3499, 0, { Colour: "Sage" }, 4499),
  ], [{ group: "Build", label: "Capacity", value: "1.2 L (40 oz)" }, { group: "Build", label: "Material", value: "18/8 stainless steel" }]),
  sample(2, "sample-pet-seat-cover", "Waterproof Pet Seat Cover", "pets", "Quilted, non-slip cover that protects recliners and sofas.", [
    v(201, "SMP-201", 3299, 15, { Size: "Single" }), v(202, "SMP-202", 4299, 9, { Size: "Double" }),
  ], [{ group: "Build", label: "Backing", value: "Non-slip silicone dots" }]),
  sample(3, "sample-squeeze-toy", "Soft Squeeze Toy", "kids", "Slow-rise stress toy, a good classroom prize or party favour.", [
    v(301, "SMP-301", 1299, 40, { Colour: "Peach" }), v(302, "SMP-302", 1299, 2, { Colour: "Mint" }),
  ]),
  sample(4, "sample-led-desk-lamp", "LED Desk Lamp with Wireless Charger", "tech", "Dimmable lamp with a 10W charging pad in the base.", [
    v(401, "SMP-401", 5999, 12, { Finish: "Black" }, 7999), v(402, "SMP-402", 5999, 7, { Finish: "White" }, 7999),
  ], [{ group: "Power", label: "Charging pad", value: "10 W Qi" }, { group: "Power", label: "Input", value: "USB-C, 18 W adapter" }]),
  sample(5, "sample-linen-tote", "Everyday Linen Tote", "fashion", "Structured tote with an inner zip pocket.", [
    v(501, "SMP-501", 2899, 30, { Colour: "Natural" }), v(502, "SMP-502", 2899, 18, { Colour: "Black" }),
  ]),
  sample(6, "sample-cable-organiser", "Magnetic Cable Organiser (6 pack)", "tech", "Keeps charging cables tidy on desks and bedside tables.", [
    v(601, "SMP-601", 1499, 60, { Colour: "Grey" }),
  ]),
  sample(7, "sample-ceramic-planter", "Ceramic Planter Set", "home", "Three matte planters with drainage holes and trays.", [
    v(701, "SMP-701", 3999, 6, { Size: "Set of 3" }),
  ]),
  sample(8, "sample-pet-water-bottle", "Portable Pet Water Bottle", "pets", "Leak-proof bottle with fold-out drinking bowl.", [
    v(801, "SMP-801", 1999, 22, { Capacity: "350 ml" }), v(802, "SMP-802", 2299, 11, { Capacity: "550 ml" }),
  ]),
];

function filterSample(query?: string): Product[] {
  const q = query?.trim().toLowerCase();
  return q ? SAMPLE.filter((p) => `${p.title} ${p.category}`.toLowerCase().includes(q)) : SAMPLE;
}
