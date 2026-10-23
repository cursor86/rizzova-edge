import "server-only";
import type { Product, Spec, Variant } from "./types";

/**
 * Catalogue access for server components.
 * - RIZZOVA_API_URL set: reads the rizzova-edge Worker (the real store).
 * - Otherwise preview mode: reads the public product feed of the current rizzova.com shop
 *   (WooCommerce Store API, read-only), falling back to a small labelled sample catalogue.
 *   Preview mode never takes orders.
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
  if (!API) return filterPreview(await previewCatalogue(), query);
  const qs = new URLSearchParams({ limit: "24" });
  if (query) qs.set("q", query);
  const list = await api<ApiList>(`/api/products?${qs.toString()}`);
  if (!list) return [];
  const details = await Promise.all(list.items.map((i) => api<ApiDetail>(`/api/products/${encodeURIComponent(i.slug)}`)));
  return details.filter((d): d is ApiDetail => d !== null).map(fromApi);
}

export async function getProduct(slug: string): Promise<Product | null> {
  if (!API) return (await previewCatalogue()).find((p) => p.slug === slug) ?? null;
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

function filterPreview(all: Product[], query?: string): Product[] {
  const q = query?.trim().toLowerCase();
  return q ? all.filter((p) => `${p.title} ${p.category}`.toLowerCase().includes(q)) : all;
}

// ─────────────── Preview feed: the live rizzova.com WooCommerce catalogue (read-only) ───────────────
const PREVIEW_FEED = "https://rizzova.com/wp-json/wc/store/v1/products";

interface WooProduct {
  id: number; slug: string; name: string; short_description: string; is_in_stock: boolean;
  prices: { price: string; regular_price: string; currency_code: string; currency_minor_unit: number };
  images: { src: string; alt: string }[];
  categories: { name: string }[];
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&#8211;": "–", "&#8212;": "—", "&#8217;": "’", "&#8216;": "‘", "&#8220;": "“", "&#8221;": "”", "&quot;": "\"", "&#039;": "'", "&nbsp;": " " };
const decode = (s: string): string => s.replace(/&#?\w+;/g, (m) => ENTITIES[m] ?? m);
const stripTags = (s: string): string => decode(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();

function fromWoo(w: WooProduct): Product | null {
  const scale = 10 ** (2 - w.prices.currency_minor_unit);
  const price = Math.round(Number(w.prices.price) * scale);
  const regular = Math.round(Number(w.prices.regular_price) * scale);
  if (!price || w.images.length === 0) return null;
  // One purchasable line per product in preview. Stock counts are not public, so in-stock items are not given a fake count.
  const variant: Variant = { id: w.id, sku: `RZ-${w.id}`, priceCents: price, compareAtCents: regular > price ? regular : null, stock: w.is_in_stock ? 99 : 0, attributes: {} };
  const category = decode(w.categories[0]?.name ?? "");
  return {
    id: w.id, slug: w.slug, title: decode(w.name), description: stripTags(w.short_description) || null, currency: w.prices.currency_code,
    category, images: w.images.map((i) => i.src), variants: [variant],
    specs: [{ group: "Details", label: "Category", value: category || "Rizzova" }, ...specsFromVariants([variant]).filter((s) => s.group === "Fulfilment")],
    isSample: false,
  };
}

// Feed caching. The rizzova.com feed takes 7-10 s, so pages never wait on it after the first load:
// 1. per-isolate memory (instant), 2. a KV snapshot on Cloudflare (fast, shared by all isolates),
// refreshed in the background when older than 15 minutes.
const PREVIEW_TTL_MS = 15 * 60 * 1000;
const SNAPSHOT_KEY = "preview:feed:v1";
let memory: { at: number; data: Product[] } | null = null;
let inflight: Promise<Product[]> | null = null;

interface KvLike {
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}
interface CfContextLike { env: { STATIC?: KvLike }; ctx: { waitUntil(p: Promise<unknown>): void } }

async function cloudflareContext(): Promise<CfContextLike | null> {
  try {
    const mod = await import("@opennextjs/cloudflare");
    return (await mod.getCloudflareContext({ async: true })) as unknown as CfContextLike;
  } catch {
    return null; // plain `next start` / `next dev`
  }
}

function refresh(kv: KvLike | undefined): Promise<Product[]> {
  inflight ??= loadPreviewFeed().then(async (data) => {
    if (!data[0]?.isSample) {
      memory = { at: Date.now(), data };
      if (kv) await kv.put(SNAPSHOT_KEY, JSON.stringify({ at: memory.at, data })).catch(() => undefined);
    }
    return data;
  }).finally(() => { inflight = null; });
  return inflight;
}

async function previewCatalogue(): Promise<Product[]> {
  const fresh = (at: number) => Date.now() - at < PREVIEW_TTL_MS;
  if (memory && fresh(memory.at)) return memory.data;
  const cf = await cloudflareContext();
  const kv = cf?.env.STATIC;
  if (!memory && kv) {
    const snap = (await kv.get(SNAPSHOT_KEY, "json").catch(() => null)) as { at: number; data: Product[] } | null;
    if (snap?.data?.length) memory = snap;
  }
  if (memory) {
    if (!fresh(memory.at)) {
      const job = refresh(kv);
      if (cf) cf.ctx.waitUntil(job);
    }
    return memory.data; // serve the snapshot now, even if a refresh is running
  }
  return refresh(kv);
}

async function loadPreviewFeed(): Promise<Product[]> {
  try {
    const pages = await Promise.all([1, 2, 3].map(async (page) => {
      const res = await fetch(`${PREVIEW_FEED}?per_page=100&page=${page}&orderby=popularity`, { next: { revalidate: 900 } });
      return res.ok ? ((await res.json()) as WooProduct[]) : [];
    }));
    const products = pages.flat().map(fromWoo).filter((p): p is Product => p !== null);
    return products.length > 0 ? products : SAMPLE;
  } catch {
    return SAMPLE;
  }
}

/** Where preview data came from, for the banner. */
export async function previewSource(): Promise<"rizzova.com" | "sample" | null> {
  if (API) return null;
  const all = await previewCatalogue();
  return all[0]?.isSample ? "sample" : "rizzova.com";
}
