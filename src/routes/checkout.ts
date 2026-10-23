import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../env";
import { loadCart, MAX_LINES } from "./cart";
import { now } from "../lib/util";

export const checkout = new Hono<{ Bindings: Env }>();

interface VariantRow {
  id: number; sku: string; price_cents: number; cost_cents: number; stock_qty: number;
  ae_sku_attr: string; aliexpress_product_id: string; title: string; currency: string;
}

async function nextOrderNumber(db: D1Database): Promise<string> {
  const row = await db.prepare(`UPDATE counters SET value = value + 1 WHERE name = 'order_number' RETURNING value`).first<{ value: number }>();
  return `RZ-${row?.value ?? Date.now()}`;
}

/**
 * POST /api/checkout { email? }
 * 1. Reads the cart from KV (cookie), re-prices every line from D1 (client prices are ignored).
 * 2. Writes a 'pending' order + items in one D1 batch (atomic).
 * 3. Creates a Stripe Checkout Session (REST via fetch) and returns its URL.
 * Payment is confirmed only by the signed Stripe webhook, never by the redirect.
 */
checkout.post("/", async (c) => {
  const body = await c.req.json<{ email?: string }>().catch(() => ({} as { email?: string }));
  const cart = await loadCart(c.env, getCookie(c, "rz_cart"));
  if (!cart || cart.lines.length === 0) return c.json({ error: "Cart is empty" }, 400);
  if (cart.lines.length > MAX_LINES) return c.json({ error: "Too many lines" }, 400);

  const ids = cart.lines.map((l) => l.variantId);
  const { results: rows } = await c.env.DB.prepare(
    `SELECT v.id, v.sku, v.price_cents, v.cost_cents, v.stock_qty, v.ae_sku_attr, p.aliexpress_product_id, p.title, p.currency
     FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.id IN (${ids.map(() => "?").join(",")}) AND v.is_active = 1 AND p.status = 'active'`,
  ).bind(...ids).all<VariantRow>();
  const byId = new Map(rows.map((r) => [r.id, r]));

  const problems: { variantId: number; reason: string }[] = [];
  for (const l of cart.lines) {
    const v = byId.get(l.variantId);
    if (!v) problems.push({ variantId: l.variantId, reason: "unavailable" });
    else if (v.stock_qty < l.quantity) problems.push({ variantId: l.variantId, reason: `only ${v.stock_qty} left` });
  }
  if (problems.length) return c.json({ error: "Some items changed", problems }, 409);

  const currency = c.env.STORE_CURRENCY;
  const subtotal = cart.lines.reduce((s, l) => s + byId.get(l.variantId)!.price_cents * l.quantity, 0);
  const orderId = crypto.randomUUID();
  const orderNumber = await nextOrderNumber(c.env.DB);
  const t = now();
  const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ? body.email : null;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO orders (id, order_number, email, status, currency, subtotal_cents, shipping_cents, total_cents, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, 0, ?, ?, ?)`,
    ).bind(orderId, orderNumber, email, currency, subtotal, subtotal, t, t),
    ...cart.lines.map((l) => {
      const v = byId.get(l.variantId)!;
      return c.env.DB.prepare(
        `INSERT INTO order_items (order_id, variant_id, ae_product_id, ae_sku_attr, title, sku, unit_price_cents, unit_cost_cents, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(orderId, v.id, v.aliexpress_product_id, v.ae_sku_attr, v.title, v.sku, v.price_cents, v.cost_cents, l.quantity);
    }),
  ]);

  // Stripe Checkout Session (form-encoded REST API).
  const site = c.env.PUBLIC_SITE_URL.replace(/\/$/, "");
  const form = new URLSearchParams({
    mode: "payment",
    success_url: `${site}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/cart`,
    client_reference_id: orderId,
    "metadata[order_id]": orderId,
    "payment_intent_data[metadata][order_id]": orderId,
    "phone_number_collection[enabled]": "true",
  });
  if (email) form.set("customer_email", email);
  c.env.CHECKOUT_COUNTRIES.split(",").map((s) => s.trim()).filter(Boolean)
    .forEach((cc, i) => form.set(`shipping_address_collection[allowed_countries][${i}]`, cc));
  cart.lines.forEach((l, i) => {
    const v = byId.get(l.variantId)!;
    form.set(`line_items[${i}][quantity]`, String(l.quantity));
    form.set(`line_items[${i}][price_data][currency]`, currency.toLowerCase());
    form.set(`line_items[${i}][price_data][unit_amount]`, String(v.price_cents));
    form.set(`line_items[${i}][price_data][product_data][name]`, v.title.slice(0, 250));
    form.set(`line_items[${i}][price_data][product_data][metadata][sku]`, v.sku);
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${c.env.STRIPE_SECRET_KEY}`,
      "content-type": "application/x-www-form-urlencoded",
      "idempotency-key": `checkout-${orderId}`,
    },
    body: form,
  });
  const session: any = await res.json();
  if (!res.ok) {
    await c.env.DB.prepare(`UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?`).bind(now(), orderId).run();
    console.error("stripe error", session?.error);
    return c.json({ error: "Could not start payment" }, 502);
  }
  await c.env.DB.prepare(`UPDATE orders SET stripe_session_id = ?, updated_at = ? WHERE id = ?`).bind(session.id, now(), orderId).run();
  return c.json({ orderId, orderNumber, checkoutUrl: session.url });
});
