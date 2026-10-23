import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import type { Env } from "../env";

export interface CartLine { variantId: number; quantity: number }
export interface Cart { id: string; lines: CartLine[]; updatedAt: number }

const CART_TTL = 60 * 60 * 24 * 14; // 14 days
export const MAX_LINES = 50;

export async function loadCart(env: Env, id: string | undefined): Promise<Cart | null> {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null;
  return env.KV.get<Cart>(`cart:${id}`, "json");
}
const saveCart = (env: Env, cart: Cart) => env.KV.put(`cart:${cart.id}`, JSON.stringify(cart), { expirationTtl: CART_TTL });

export const cart = new Hono<{ Bindings: Env }>();

cart.get("/", async (c) => c.json((await loadCart(c.env, getCookie(c, "rz_cart"))) ?? { lines: [] }));

/** POST /api/cart { variantId, quantity } – sets the quantity (0 removes). Prices are never trusted from the client. */
cart.post("/", async (c) => {
  const body = await c.req.json<{ variantId?: number; quantity?: number }>().catch(() => ({} as { variantId?: number; quantity?: number }));
  const variantId = Number(body.variantId);
  const quantity = Math.floor(Number(body.quantity));
  if (!Number.isInteger(variantId) || variantId <= 0 || !Number.isInteger(quantity) || quantity < 0 || quantity > 20) {
    return c.json({ error: "variantId and quantity (0-20) required" }, 400);
  }
  if (quantity > 0) {
    const v = await c.env.DB.prepare(`SELECT stock_qty FROM product_variants WHERE id = ? AND is_active = 1`).bind(variantId).first<{ stock_qty: number }>();
    if (!v) return c.json({ error: "Variant not available" }, 404);
    if (v.stock_qty < quantity) return c.json({ error: "Not enough stock", available: v.stock_qty }, 409);
  }
  const existing = await loadCart(c.env, getCookie(c, "rz_cart"));
  const current: Cart = existing ?? { id: crypto.randomUUID(), lines: [], updatedAt: Date.now() };
  current.lines = current.lines.filter((l) => l.variantId !== variantId);
  if (quantity > 0) current.lines.push({ variantId, quantity });
  if (current.lines.length > MAX_LINES) return c.json({ error: `Cart limited to ${MAX_LINES} lines` }, 400);
  current.updatedAt = Date.now();
  await saveCart(c.env, current);
  setCookie(c, "rz_cart", current.id, { httpOnly: true, secure: true, sameSite: "Lax", path: "/", maxAge: CART_TTL });
  return c.json(current);
});
