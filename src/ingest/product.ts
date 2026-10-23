import type { Env } from "../env";
import { getDsProduct, list, type DsProduct, type DsSku } from "../aliexpress/dropshipper";
import { imageIdFor, uploadImageFromUrl } from "./images";
import { now, retailFromCost, sanitizeHtml, slugify, toCents } from "../lib/util";

const MAX_IMAGES = 8;

interface MappedVariant {
  aeSkuId: string;
  aeSkuAttr: string;
  sku: string;
  costCents: number;
  priceCents: number;
  compareAtCents: number | null;
  stock: number;
  attributes: Record<string, string>;
  imageUrl?: string;
}

function mapVariant(env: Env, aeProductId: string, s: DsSku): MappedVariant | null {
  const aeSkuId = String(s.sku_id ?? "");
  const aeSkuAttr = String(s.sku_attr ?? s.id ?? "");
  const cost = toCents(s.offer_sale_price) ?? toCents(s.sku_price);
  if (!aeSkuId || cost === null) return null;
  const markup = Number(env.PRICE_MARKUP) || 2;
  const compareMarkup = Number(env.COMPARE_AT_MARKUP) || 0;
  const price = retailFromCost(cost, markup);
  const attributes: Record<string, string> = {};
  let image: string | undefined;
  for (const p of list(s.ae_sku_property_dtos?.ae_sku_property_d_t_o)) {
    if (p.sku_property_name) attributes[p.sku_property_name] = p.property_value_definition_name || p.sku_property_value || "";
    if (p.sku_image && !image) image = p.sku_image;
  }
  return {
    aeSkuId,
    aeSkuAttr,
    sku: `RZ-${aeProductId}-${aeSkuId}`,
    costCents: cost,
    priceCents: price,
    compareAtCents: compareMarkup > 1 ? Math.round(price * compareMarkup) : null,
    stock: Math.max(0, Number(s.sku_available_stock ?? 0) || 0),
    attributes,
    imageUrl: image,
  };
}

/**
 * Pull one AliExpress product and commit it to D1 in ONE atomic batch:
 * product upsert -> variant upserts -> retire vanished SKUs -> image rows -> denormalised totals.
 * Child rows find the parent with a sub-select, so no round trip is needed for the new product id.
 */
export async function ingestProduct(env: Env, token: string, aeProductId: string): Promise<{ variants: number; images: number }> {
  const ds: DsProduct = await getDsProduct(env, token, aeProductId);
  const base = ds.ae_item_base_info_dto ?? {};
  const title = (base.subject ?? "").trim();
  if (!title) throw new Error(`Product ${aeProductId} has no title`);

  const variants = list(ds.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o)
    .map((s) => mapVariant(env, aeProductId, s))
    .filter((v): v is MappedVariant => v !== null);
  if (variants.length === 0) throw new Error(`Product ${aeProductId} has no purchasable SKUs`);

  // Images: gallery first, then variant swatches. Upload before the DB batch so rows only reference stored media.
  const gallery = (ds.ae_multimedia_info_dto?.image_urls ?? "").split(";").map((u) => u.trim()).filter(Boolean).slice(0, MAX_IMAGES);
  const swatches = [...new Set(variants.map((v) => v.imageUrl).filter((u): u is string => !!u))].filter((u) => !gallery.includes(u));
  const uploaded = new Map<string, string>(); // source url -> image id
  for (const url of [...gallery, ...swatches]) {
    try {
      uploaded.set(url, await uploadImageFromUrl(env, url, await imageIdFor(aeProductId, url)));
    } catch (err) {
      console.warn("image skipped", url, (err as Error).message); // one bad image must not block the product
    }
  }

  const run = now();
  const productIdSql = `(SELECT id FROM products WHERE aliexpress_product_id = ?)`;
  const live = base.product_status_type ? base.product_status_type === "onSelling" : true;
  const featureId = gallery.map((u) => uploaded.get(u)).find(Boolean) ?? null;
  const stmts: D1PreparedStatement[] = [];

  stmts.push(
    env.DB.prepare(
      `INSERT INTO products (aliexpress_product_id, title, description, slug, status, currency, feature_image_id, last_synced_at, sync_error, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, NULL, ?8, ?8)
       ON CONFLICT(aliexpress_product_id) DO UPDATE SET
         title=excluded.title, description=excluded.description,
         status = CASE WHEN products.status = 'archived' THEN 'archived' ELSE excluded.status END,
         currency=excluded.currency, feature_image_id=COALESCE(excluded.feature_image_id, products.feature_image_id),
         last_synced_at=excluded.last_synced_at, sync_error=NULL, updated_at=excluded.updated_at`,
    ).bind(aeProductId, title, sanitizeHtml(base.detail), slugify(title, aeProductId), live ? "active" : "unavailable", env.STORE_CURRENCY, featureId, run),
  );

  for (const v of variants) {
    stmts.push(
      env.DB.prepare(
        `INSERT INTO product_variants (product_id, ae_sku_id, ae_sku_attr, sku, price_cents, compare_at_price_cents, cost_cents, stock_qty, attributes_json, is_active, synced_run)
         VALUES (${productIdSql}, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(product_id, ae_sku_id) DO UPDATE SET
           ae_sku_attr=excluded.ae_sku_attr, price_cents=excluded.price_cents, compare_at_price_cents=excluded.compare_at_price_cents,
           cost_cents=excluded.cost_cents, stock_qty=excluded.stock_qty, attributes_json=excluded.attributes_json,
           is_active=1, synced_run=excluded.synced_run`,
      ).bind(aeProductId, v.aeSkuId, v.aeSkuAttr, v.sku, v.priceCents, v.compareAtCents, v.costCents, v.stock, JSON.stringify(v.attributes), run),
    );
  }

  // SKUs that disappeared upstream: deactivate (never delete; past orders reference them).
  stmts.push(
    env.DB.prepare(`UPDATE product_variants SET is_active = 0, stock_qty = 0 WHERE product_id = ${productIdSql} AND synced_run <> ?`).bind(aeProductId, run),
  );

  let position = 0;
  for (const url of gallery) {
    const id = uploaded.get(url);
    if (!id) continue;
    stmts.push(
      env.DB.prepare(
        `INSERT INTO product_images (product_id, cloudflare_image_id, source_url, position, is_feature)
         VALUES (${productIdSql}, ?, ?, ?, ?)
         ON CONFLICT(product_id, cloudflare_image_id) DO UPDATE SET position=excluded.position, is_feature=excluded.is_feature`,
      ).bind(aeProductId, id, url, position, position === 0 ? 1 : 0),
    );
    position++;
  }
  for (const v of variants) {
    const id = v.imageUrl ? uploaded.get(v.imageUrl) : undefined;
    if (!id) continue;
    stmts.push(
      env.DB.prepare(
        `INSERT INTO product_images (product_id, variant_id, cloudflare_image_id, source_url, position, is_feature)
         VALUES (${productIdSql}, (SELECT id FROM product_variants WHERE product_id = ${productIdSql} AND ae_sku_id = ?), ?, ?, 100, 0)
         ON CONFLICT(product_id, cloudflare_image_id) DO UPDATE SET variant_id=excluded.variant_id`,
      ).bind(aeProductId, aeProductId, v.aeSkuId, id, v.imageUrl!),
    );
  }

  // Denormalised listing fields.
  stmts.push(
    env.DB.prepare(
      `UPDATE products SET
         min_price_cents = (SELECT MIN(price_cents) FROM product_variants WHERE product_id = products.id AND is_active = 1),
         max_price_cents = (SELECT MAX(price_cents) FROM product_variants WHERE product_id = products.id AND is_active = 1),
         total_stock     = (SELECT COALESCE(SUM(stock_qty),0) FROM product_variants WHERE product_id = products.id AND is_active = 1)
       WHERE aliexpress_product_id = ?`,
    ).bind(aeProductId),
  );
  stmts.push(env.DB.prepare(`DELETE FROM import_queue WHERE aliexpress_product_id = ?`).bind(aeProductId));

  await env.DB.batch(stmts); // D1 batches run as a single transaction
  return { variants: variants.length, images: uploaded.size };
}

export async function recordSyncError(env: Env, aeProductId: string, message: string) {
  await env.DB.batch([
    env.DB.prepare(`UPDATE products SET sync_error = ?, last_synced_at = ? WHERE aliexpress_product_id = ?`).bind(message.slice(0, 500), now(), aeProductId),
    env.DB.prepare(`UPDATE import_queue SET attempts = attempts + 1, last_error = ? WHERE aliexpress_product_id = ?`).bind(message.slice(0, 500), aeProductId),
  ]);
}
