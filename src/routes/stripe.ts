import { Hono } from "hono";
import type { Env } from "../env";
import { hmacSha256Hex, now, safeEqual } from "../lib/util";

export const stripeWebhook = new Hono<{ Bindings: Env }>();

const TOLERANCE_S = 300;

/** Verifies the Stripe-Signature header (t=...,v1=...) over `${t}.${rawBody}`. */
async function verify(secret: string, header: string | undefined, raw: string): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=", 2) as [string, string]));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > TOLERANCE_S) return false;
  const expected = await hmacSha256Hex(secret, `${t}.${raw}`);
  return header.split(",").some((kv) => kv.startsWith("v1=") && safeEqual(kv.slice(3), expected));
}

stripeWebhook.post("/", async (c) => {
  const raw = await c.req.text();
  if (!(await verify(c.env.STRIPE_WEBHOOK_SECRET, c.req.header("stripe-signature"), raw))) return c.json({ error: "Bad signature" }, 400);
  const event = JSON.parse(raw);

  // Idempotency: skip events already processed. The event is recorded only after it succeeds,
  // so a failure returns non-2xx and Stripe's retry is processed. The order updates below are
  // guarded by status, so a concurrent duplicate cannot double-apply.
  const seen = await c.env.DB.prepare(`SELECT 1 FROM webhook_events WHERE id = ?`).bind(event.id).first();
  if (seen) return c.json({ duplicate: true });
  const markProcessed = () =>
    c.env.DB.prepare(`INSERT OR IGNORE INTO webhook_events (id, type, received_at) VALUES (?, ?, ?)`).bind(event.id, event.type, now()).run();

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data.object;
    // Async methods complete later: record nothing, the async_payment_succeeded event follows.
    if (s.payment_status !== "paid") return c.json({ ok: true, awaiting: s.payment_status });
    const orderId: string | undefined = s.metadata?.order_id ?? s.client_reference_id;
    if (!orderId) {
      await markProcessed(); // not one of ours; never retryable
      return c.json({ ignored: "no order id" });
    }
    // Newer API versions nest shipping under collected_information; older ones use shipping_details.
    const ship = s.collected_information?.shipping_details ?? s.shipping_details ?? {};
    const details = s.customer_details ?? {};
    const updated = await c.env.DB.prepare(
      `UPDATE orders SET status = 'paid', stripe_payment_intent = ?, email = COALESCE(email, ?),
         -- A delivery address saved at checkout wins; Stripe's (possibly billing) address only fills gaps.
         shipping_name = COALESCE(shipping_name, ?), shipping_phone = COALESCE(shipping_phone, ?),
         shipping_address_json = COALESCE(shipping_address_json, ?), total_cents = ?, updated_at = ?
       WHERE id = ? AND status = 'pending'`,
    ).bind(
      s.payment_intent ?? null, details.email ?? null, ship.name ?? details.name ?? null, details.phone ?? null,
      ship.address || details.address ? JSON.stringify(ship.address ?? details.address) : null, s.amount_total ?? 0, now(), orderId,
    ).run();
    if (updated.meta.changes) await c.env.JOBS.send({ type: "fulfil-order", orderId });
  }

  if (event.type === "checkout.session.expired") {
    const orderId = event.data.object.metadata?.order_id;
    if (orderId) await c.env.DB.prepare(`UPDATE orders SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'pending'`).bind(now(), orderId).run();
  }
  await markProcessed();
  return c.json({ ok: true });
});
