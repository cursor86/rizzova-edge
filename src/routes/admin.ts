import { Hono, type MiddlewareHandler } from "hono";
import type { Env } from "../env";
import { safeEqual, now } from "../lib/util";

export const requireAdmin: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const header = c.req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : c.req.query("admin_token") ?? "";
  if (!c.env.ADMIN_TOKEN || !token || !safeEqual(token, c.env.ADMIN_TOKEN)) return c.json({ error: "Unauthorised" }, 401);
  await next();
};

export const admin = new Hono<{ Bindings: Env }>();
admin.use("*", requireAdmin);

/** Queue AliExpress product ids for import: { "productIds": ["1005001234567890", ...] } */
admin.post("/import", async (c) => {
  const body = await c.req.json<{ productIds?: unknown }>().catch(() => ({ productIds: undefined }));
  const ids = Array.isArray(body.productIds) ? body.productIds.map(String).filter((s) => /^\d{6,20}$/.test(s)) : [];
  if (ids.length === 0 || ids.length > 500) return c.json({ error: "Send 1-500 numeric productIds" }, 400);
  const t = now();
  for (let i = 0; i < ids.length; i += 50) {
    await c.env.DB.batch(
      ids.slice(i, i + 50).map((id) =>
        c.env.DB.prepare(`INSERT OR IGNORE INTO import_queue (aliexpress_product_id, requested_at) VALUES (?, ?)`).bind(id, t),
      ),
    );
  }
  for (let i = 0; i < ids.length; i += 100) {
    await c.env.JOBS.sendBatch(ids.slice(i, i + 100).map((id) => ({ body: { type: "ingest-product" as const, aeProductId: id } })));
  }
  return c.json({ queued: ids.length });
});

admin.get("/stats", async (c) => {
  const r = await c.env.DB.batch([
    c.env.DB.prepare(`SELECT status, COUNT(*) AS n FROM products GROUP BY status`),
    c.env.DB.prepare(`SELECT COUNT(*) AS n FROM import_queue`),
    c.env.DB.prepare(`SELECT status, COUNT(*) AS n FROM orders GROUP BY status`),
    c.env.DB.prepare(`SELECT aliexpress_product_id, sync_error FROM products WHERE sync_error IS NOT NULL LIMIT 20`),
  ]);
  return c.json({ products: r[0]?.results, importQueue: r[1]?.results?.[0], orders: r[2]?.results, syncErrors: r[3]?.results });
});
