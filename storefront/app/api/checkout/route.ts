import { NextResponse, type NextRequest } from "next/server";
import { checkoutRequestSchema, type CheckoutResponse } from "@/lib/checkout-schema";

const API = process.env.RIZZOVA_API_URL?.replace(/\/$/, "") ?? "";
const TIMEOUT_MS = 10_000;

const reply = (body: CheckoutResponse, status: number) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

/**
 * POST /api/checkout
 * Validates the request, then hands off to the rizzova-edge Worker: it rebuilds the cart server-side,
 * re-prices every line from D1 (bundle discounts included), creates the order and the Stripe Checkout Session.
 * Payment is confirmed only by Stripe's signed webhook on the Worker (/webhooks/stripe).
 * Without RIZZOVA_API_URL it runs in preview mode and never takes payment.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Same-origin only: blocks other sites from starting checkouts with a visitor's browser.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.nextUrl.host) {
    return reply({ ok: false, code: "forbidden", message: "Cross-site request blocked" }, 403);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return reply({ ok: false, code: "invalid", message: "Request body must be JSON" }, 400);
  }
  const parsed = checkoutRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return reply({ ok: false, code: "invalid", message: parsed.error.issues[0]?.message ?? "Invalid checkout details" }, 422);
  }
  const { contact, delivery, lines, shippingMethod } = parsed.data;

  if (!API) {
    return reply({ ok: true, mode: "preview", orderNumber: `PREVIEW-${Date.now().toString(36).toUpperCase()}`, message: "Preview mode: no order was created and no payment was taken." }, 200);
  }

  try {
    // 1. Rebuild the cart on the Worker. The first response sets the rz_cart cookie; reuse it for every call.
    let cookie = "";
    for (const line of lines) {
      const res = await fetch(`${API}/api/cart`, {
        method: "POST",
        headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
        body: JSON.stringify(line),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const setCookie = res.headers.get("set-cookie");
      const match = setCookie?.match(/rz_cart=([^;]+)/);
      if (match) cookie = `rz_cart=${match[1]}`;
      if (res.status === 404 || res.status === 409) {
        const detail = (await res.json().catch(() => ({}))) as { error?: string };
        return reply({ ok: false, code: "stock", message: detail.error ?? "An item is no longer available", problems: [{ variantId: line.variantId, reason: detail.error ?? "unavailable" }] }, 409);
      }
      if (!res.ok) throw new Error(`cart sync failed with ${res.status}`);
    }

    // 2. Create the order and the Stripe session.
    const res = await fetch(`${API}/api/checkout`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({
        email: contact.email,
        shippingMethod,
        shipping: { name: delivery.name, phone: contact.phone, line1: delivery.line1, line2: delivery.line2, city: delivery.city, state: delivery.state, postalCode: delivery.postalCode, country: delivery.country },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => ({}))) as { orderNumber?: string; checkoutUrl?: string; error?: string; problems?: { variantId: number; reason: string }[] };

    if (res.status === 409) return reply({ ok: false, code: "stock", message: body.error ?? "Some items changed", problems: body.problems }, 409);
    if (res.status === 502) return reply({ ok: false, code: "payment_unavailable", message: "Payment could not be started. Please try again in a minute." }, 502);
    if (!res.ok || !body.checkoutUrl || !body.orderNumber) throw new Error(`checkout failed with ${res.status}`);
    if (!body.checkoutUrl.startsWith("https://checkout.stripe.com/")) throw new Error("Unexpected payment URL");

    return reply({ ok: true, mode: "live", orderNumber: body.orderNumber, checkoutUrl: body.checkoutUrl }, 200);
  } catch (err) {
    const timedOut = err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError");
    console.error("checkout handoff failed", err);
    return reply({ ok: false, code: "upstream", message: timedOut ? "The store took too long to respond. Please try again." : "Something went wrong starting checkout. Please try again." }, 503);
  }
}
