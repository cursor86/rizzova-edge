import { Hono } from "hono";
import type { Env } from "../env";
import { imageUrl } from "../ingest/images";

export const products = new Hono<{ Bindings: Env }>();

interface Cursor { c: number; i: number }
const encodeCursor = (c: Cursor) => btoa(JSON.stringify(c)).replace(/=+$/, "");
function decodeCursor(s: string | undefined): Cursor | null {
  if (!s) return null;
  try {
    const v = JSON.parse(atob(s));
    return Number.isInteger(v.c) && Number.isInteger(v.i) ? v : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/products?limit=24&cursor=...&category=12&q=tumbler
 * Keyset pagination on (created_at DESC, id DESC): constant-time pages at any depth (no OFFSET scans).
 * Served through the edge Cache API for 60s (+5 min stale-while-revalidate). The Cache API applies on a custom domain.
 */
products.get("/", async (c) => {
  const cache = caches.default;
  const cacheKey = new Request(new URL(c.req.url).toString(), { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 24, 1), 60);
  const cursor = decodeCursor(c.req.query("cursor"));
  const category = Number(c.req.query("category")) || null;
  const q = (c.req.query("q") ?? "").trim().replace(/["*^():]/g, " ").slice(0, 80);

  const where: string[] = ["p.status = 'active'", "p.total_stock > 0"];
  const binds: (string | number)[] = [];
  if (category) { where.push("p.category_id = ?"); binds.push(category); }
  if (q) { where.push("p.id IN (SELECT rowid FROM products_fts WHERE products_fts MATCH ?)"); binds.push(q.split(/\s+/).filter(Boolean).map((t) => `"${t}"*`).join(" ")); }
  if (cursor) { where.push("(p.created_at, p.id) < (?, ?)"); binds.push(cursor.c, cursor.i); }

  const { results } = await c.env.DB.prepare(
    `SELECT p.id, COALESCE(pc.title, p.title) AS title, p.slug, p.currency, p.min_price_cents, p.max_price_cents, p.feature_image_id, p.created_at
     FROM products p
     LEFT JOIN product_copy pc ON pc.product_id = p.id AND pc.status = 'approved'
     WHERE ${where.join(" AND ")}
     ORDER BY p.created_at DESC, p.id DESC
     LIMIT ?`,
  ).bind(...binds, limit + 1).all<{
    id: number; title: string; slug: string; currency: string;
    min_price_cents: number | null; max_price_cents: number | null; feature_image_id: string | null; created_at: number;
  }>();

  const page = results.slice(0, limit);
  const last = page[page.length - 1];
  const body = {
    items: page.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      currency: p.currency,
      priceFrom: p.min_price_cents,
      priceTo: p.max_price_cents,
      image: p.feature_image_id ? imageUrl(c.env, p.feature_image_id) : null,
    })),
    nextCursor: results.length > limit && last ? encodeCursor({ c: last.created_at, i: last.id }) : null,
  };
  const res = new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" },
  });
  c.executionCtx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
});

/** GET /api/products/:slug – product detail with active variants and images. */
products.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  const product = await c.env.DB.prepare(
    // Approved Rizz AI copy (plain text) replaces the supplier title and description.
    `SELECT p.id, COALESCE(pc.title, p.title) AS title, p.slug, COALESCE(pc.description, p.description) AS description,
            pc.summary, p.currency, p.min_price_cents, p.max_price_cents
     FROM products p LEFT JOIN product_copy pc ON pc.product_id = p.id AND pc.status = 'approved'
     WHERE p.slug = ? AND p.status = 'active'`,
  ).bind(slug).first<{ id: number }>();
  if (!product) return c.json({ error: "Not found" }, 404);
  const [variants, images] = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT id, sku, price_cents, compare_at_price_cents, stock_qty, attributes_json FROM product_variants WHERE product_id = ? AND is_active = 1 ORDER BY price_cents`).bind(product.id),
    c.env.DB.prepare(`SELECT cloudflare_image_id, variant_id, is_feature FROM product_images WHERE product_id = ? ORDER BY position`).bind(product.id),
  ]);
  return c.json(
    {
      ...product,
      variants: (variants?.results ?? []).map((v: any) => ({ ...v, attributes: JSON.parse(v.attributes_json), attributes_json: undefined })),
      images: (images?.results ?? []).map((i: any) => ({ url: imageUrl(c.env, i.cloudflare_image_id), variantId: i.variant_id, feature: !!i.is_feature })),
    },
    200,
    { "cache-control": "public, max-age=30, s-maxage=60" },
  );
});
