import { Hono, type MiddlewareHandler } from "hono";
import type { Env } from "../env";
import { safeEqual, now } from "../lib/util";
import { callSystem, callBusiness, AliExpressError } from "../aliexpress/client";
import { getAccessToken } from "../aliexpress/auth";

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

/**
 * Signing self-test: calls /auth/token/create with a dummy code. A correct signature gets an
 * "invalid code" style error back; a signing problem gets IncompleteSignature. Never returns secret values.
 */
admin.get("/ae-selftest", async (c) => {
  const secret = c.env.AE_APP_SECRET ?? "";
  const key = c.env.AE_APP_KEY ?? "";
  const facts = {
    appKeySet: key.trim().length > 0,
    appKeyHadWhitespace: key !== key.trim(),
    secretLength: secret.trim().length,
    secretHadWhitespace: secret !== secret.trim(),
  };
  try {
    await callSystem(c.env, "/auth/token/create", { code: "selftest-invalid-code" });
    return c.json({ ...facts, result: "unexpected success" });
  } catch (err) {
    const e = err as AliExpressError;
    return c.json({ ...facts, aliexpressCode: e.code, message: e.message, signatureOk: e.code !== "IncompleteSignature" });
  }
});

/** Read-only AliExpress API probe for checking real field names. Order-placing methods are not allowed here. */
const PROBE_METHODS = new Set([
  "aliexpress.ds.feedname.get",
  "aliexpress.ds.feed.itemids.get",
  "aliexpress.ds.product.get",
  "aliexpress.ds.category.get",
  "aliexpress.ds.freight.query",
  "aliexpress.ds.order.tracking.get",
  "aliexpress.trade.ds.order.get",
  "aliexpress.ds.text.search",
]);

admin.get("/ae-probe", async (c) => {
  const method = c.req.query("method") ?? "";
  if (!PROBE_METHODS.has(method)) return c.json({ error: "Method not allowed", allowed: [...PROBE_METHODS] }, 400);
  let params: Record<string, string> = {};
  try {
    params = JSON.parse(c.req.query("params") ?? "{}");
  } catch {
    return c.json({ error: "params must be JSON" }, 400);
  }
  try {
    return c.json(await callBusiness(c.env, method, await getAccessToken(c.env), params));
  } catch (err) {
    const e = err as AliExpressError;
    return c.json({ error: e.message, code: e.code }, 502);
  }
});

const STRIPE_EVENTS = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.expired"];

/**
 * POST /admin/stripe/setup – creates the Stripe webhook for this Worker (replacing any old one at the same URL)
 * and saves its signing secret in KV, so the owner only has to add STRIPE_SECRET_KEY.
 */
admin.post("/stripe/setup", async (c) => {
  const key = c.env.STRIPE_SECRET_KEY;
  if (!key) return c.json({ ok: false, error: "STRIPE_SECRET_KEY is not set on rizzova-edge" }, 400);
  const url = `${new URL(c.req.url).origin}/webhooks/stripe`;
  const stripe = (path: string, init?: RequestInit) =>
    fetch(`https://api.stripe.com/v1${path}`, { ...init, headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" } });

  const list = (await (await stripe("/webhook_endpoints?limit=100")).json()) as { data?: { id: string; url: string }[]; error?: { message: string } };
  if (!list.data) return c.json({ ok: false, error: list.error?.message ?? "Stripe rejected the key" }, 400);
  for (const old of list.data.filter((e) => e.url === url)) await stripe(`/webhook_endpoints/${old.id}`, { method: "DELETE" });

  const form = new URLSearchParams({ url, description: "Rizzova orders (rizzova-edge)" });
  STRIPE_EVENTS.forEach((e, i) => form.set(`enabled_events[${i}]`, e));
  const created = (await (await stripe("/webhook_endpoints", { method: "POST", body: form })).json()) as { id?: string; secret?: string; livemode?: boolean; error?: { message: string } };
  if (!created.id || !created.secret) return c.json({ ok: false, error: created.error?.message ?? "Could not create webhook" }, 502);
  await c.env.KV.put("stripe:webhook_secret", created.secret);
  return c.json({ ok: true, webhookId: created.id, url, mode: created.livemode ? "live" : "test", events: STRIPE_EVENTS });
});

/** GET /admin/stripe/status – which Stripe pieces are in place (never returns secret values). */
admin.get("/stripe/status", async (c) => {
  const key = c.env.STRIPE_SECRET_KEY ?? "";
  return c.json({
    secretKey: key ? (key.startsWith("sk_live_") || key.startsWith("rk_live_") ? "live" : "test") : "missing",
    webhookSecret: c.env.STRIPE_WEBHOOK_SECRET ? "worker secret" : (await c.env.KV.get("stripe:webhook_secret")) ? "saved by setup" : "missing",
  });
});
