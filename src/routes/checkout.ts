import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import type { Env } from "../env";
import { loadCart, MAX_LINES } from "./cart";
import { now } from "../lib/util";
import { bundleRate, discountedUnit } from "../lib/bundle";
import { shippingOption } from "../lib/shipping";

export const checkout = new Hono<{ Bindings: Env }>();

interface VariantRow {
  id: number; sku: string; price_cents: number; cost_cents: number; stock_qty: number;
  ae_sku_attr: string; aliexpress_product_id: string; title: string; currency: string;
}

async function nextOrderNumber(db: D1Database): Promise<string> {
  const row = await db.prepare(`UPDATE counters SET value = value + 1 WHERE name = 'order_number' RETURNING value`).first<{ value: number }>();
  return `RZ-${row?.value ?? Date.now()}`;
}

interface ShippingInput {
  name: string; phone: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string;
}

function parseShipping(v: unknown, allowed: string[]): ShippingInput | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const str = (k: string, max = 120) => (typeof o[k] === "string" ? (o[k] as string).trim().slice(0, max) : "");
  const s: ShippingInput = {
    name: str("name"), phone: str("phone", 30), line1: str("line1"), line2: str("line2") || undefined,
    city: str("city", 80), state: str("state", 80), postalCode: str("postalCode", 12), country: str("country", 2).toUpperCase(),
  };
  return s.name && s.line1 && s.city && s.postalCode && allowed.includes(s.country) ? s : null;
}

/**
 * POST /api/checkout { email?, shipping? }
 * 1. Reads the cart from KV (cookie), re-prices every line from D1 (client prices are ignored).
 * 2. Writes a 'pending' order + items in one D1 batch (atomic).
 * 3. Creates a Stripe Checkout Session (REST via fetch) and returns its URL.
 * Payment is confirmed only by the signed Stripe webhook, never by the redirect.
 */
checkout.post("/", async (c) => {
  const body = await c.req.json<{ email?: string; shipping?: unknown; shippingMethod?: unknown }>().catch(() => ({} as { email?: string; shipping?: unknown; shippingMethod?: unknown }));
  const allowedCountries = c.env.CHECKOUT_COUNTRIES.split(",").map((x) => x.trim()).filter(Boolean);
  const shipping = parseShipping(body.shipping, allowedCountries);
  const cart = await loadCart(c.env, getCookie(c, "rz_cart"));
  if (!cart || cart.lines.length === 0) return c.json({ error: "Cart is empty" }, 400);
  if (cart.lines.length > MAX_LINES) return c.json({ error: "Too many lines" }, 400);

  const ids = [...new Set(cart.lines.map((l) => l.variantId))];
  const { results: rows } = await c.env.DB.prepare(
    `SELECT v.id, v.sku, v.price_cents, v.cost_cents, v.stock_qty, v.ae_sku_attr, p.aliexpress_product_id, p.title, p.currency
     FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.id IN (${ids.map(() => "?").join(",")}) AND v.is_active = 1 AND p.status = 'active'`,
  ).bind(...ids).all<VariantRow>();
  const byId = new Map(rows.map((r) => [r.id, r]));

  // Stock is checked per variant across all lines (a variant can be in the cart alone and in a bundle).
  const wanted = new Map<number, number>();
  for (const l of cart.lines) wanted.set(l.variantId, (wanted.get(l.variantId) ?? 0) + l.quantity);
  const problems: { variantId: number; reason: string }[] = [];
  for (const [variantId, qty] of wanted) {
    const v = byId.get(variantId);
    if (!v) problems.push({ variantId, reason: "unavailable" });
    else if (v.stock_qty < qty) problems.push({ variantId, reason: `only ${v.stock_qty} left` });
  }
  if (problems.length) return c.json({ error: "Some items changed", problems }, 409);

  // Server-side bundle pricing: rate by the number of distinct lines still in each bundle.
  const bundleSizes = new Map<string, number>();
  for (const l of cart.lines) if (l.bundleId) bundleSizes.set(l.bundleId, (bundleSizes.get(l.bundleId) ?? 0) + 1);
  const priced = cart.lines.map((l) => {
    const v = byId.get(l.variantId)!;
    const rate = l.bundleId ? bundleRate(bundleSizes.get(l.bundleId) ?? 1) : 0;
    return { line: l, v, unit: discountedUnit(v.price_cents, rate), rate };
  });

  const currency = c.env.STORE_CURRENCY;
  const subtotal = priced.reduce((s, p) => s + p.unit * p.line.quantity, 0);
  // Delivery is priced on the server from the destination country and chosen method.
  const delivery = shipping ? shippingOption(shipping.country, body.shippingMethod) : null;
  const shippingCents = delivery?.cents ?? 0;
  const orderId = crypto.randomUUID();
  const orderNumber = await nextOrderNumber(c.env.DB);
  const t = now();
  const email = typeof body.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email) ? body.email : null;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO orders (id, order_number, email, status, currency, subtotal_cents, shipping_cents, total_cents,
         shipping_name, shipping_phone, shipping_address_json, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      orderId, orderNumber, email, currency, subtotal, shippingCents, subtotal + shippingCents,
      shipping?.name ?? null, shipping?.phone ?? null,
      shipping ? JSON.stringify({ line1: shipping.line1, line2: shipping.line2 ?? null, city: shipping.city, state: shipping.state, postal_code: shipping.postalCode, country: shipping.country }) : null,
      t, t,
    ),
    ...priced.map(({ line, v, unit }) =>
      c.env.DB.prepare(
        `INSERT INTO order_items (order_id, variant_id, ae_product_id, ae_sku_attr, title, sku, unit_price_cents, unit_cost_cents, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(orderId, v.id, v.aliexpress_product_id, v.ae_sku_attr, v.title, v.sku, unit, v.cost_cents, line.quantity),
    ),
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
  if (shipping) {
    // Address already collected by the storefront: attach it to a Stripe customer so it is not asked twice.
    const customer = await stripeCustomer(c.env.STRIPE_SECRET_KEY, orderId, email, shipping);
    if (!customer) {
      await c.env.DB.prepare(`UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ?`).bind(now(), orderId).run();
      return c.json({ error: "Could not start payment" }, 502);
    }
    form.set("customer", customer);
  } else {
    if (email) form.set("customer_email", email);
    allowedCountries.forEach((cc, i) => form.set(`shipping_address_collection[allowed_countries][${i}]`, cc));
  }
  priced.forEach(({ line, v, unit, rate }, i) => {
    form.set(`line_items[${i}][quantity]`, String(line.quantity));
    form.set(`line_items[${i}][price_data][currency]`, currency.toLowerCase());
    form.set(`line_items[${i}][price_data][unit_amount]`, String(unit));
    form.set(`line_items[${i}][price_data][product_data][name]`, (rate > 0 ? `${v.title} (bundle -${Math.round(rate * 100)}%)` : v.title).slice(0, 250));
    form.set(`line_items[${i}][price_data][product_data][metadata][sku]`, v.sku);
  });
  if (delivery && delivery.cents > 0) {
    const i = priced.length;
    form.set(`line_items[${i}][quantity]`, "1");
    form.set(`line_items[${i}][price_data][currency]`, currency.toLowerCase());
    form.set(`line_items[${i}][price_data][unit_amount]`, String(delivery.cents));
    form.set(`line_items[${i}][price_data][product_data][name]`, `${delivery.label} (${delivery.estimate})`);
  }
  if (delivery) form.set("metadata[shipping_method]", delivery.id);

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

async function stripeCustomer(key: string, orderId: string, email: string | null, s: ShippingInput): Promise<string | null> {
  const form = new URLSearchParams({
    name: s.name,
    phone: s.phone,
    "shipping[name]": s.name,
    "shipping[phone]": s.phone,
    "shipping[address][line1]": s.line1,
    "shipping[address][city]": s.city,
    "shipping[address][state]": s.state,
    "shipping[address][postal_code]": s.postalCode,
    "shipping[address][country]": s.country,
    "metadata[order_id]": orderId,
  });
  if (s.line2) form.set("shipping[address][line2]", s.line2);
  if (email) form.set("email", email);
  const res = await fetch("https://api.stripe.com/v1/customers", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded", "idempotency-key": `customer-${orderId}` },
    body: form,
  });
  const body = (await res.json()) as { id?: string; error?: unknown };
  if (!res.ok || !body.id) {
    console.error("stripe customer error", body.error);
    return null;
  }
  return body.id;
}
