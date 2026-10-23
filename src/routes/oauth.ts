import { Hono } from "hono";
import type { Env } from "../env";
import { exchangeCode, tokenHealth } from "../aliexpress/auth";
import { requireAdmin } from "./admin";

export const oauth = new Hono<{ Bindings: Env }>();

/** Step 1 (admin only): redirect to the AliExpress consent page with a CSRF state. */
oauth.get("/aliexpress/start", requireAdmin, async (c) => {
  const state = crypto.randomUUID();
  await c.env.KV.put(`oauth:state:${state}`, "1", { expirationTtl: 600 });
  const redirectUri = new URL("/oauth/aliexpress/callback", c.req.url).toString();
  const url = new URL("/oauth/authorize", c.env.AE_GATEWAY);
  url.search = new URLSearchParams({
    response_type: "code",
    force_auth: "true",
    client_id: c.env.AE_APP_KEY,
    redirect_uri: redirectUri,
    state,
  }).toString();
  return c.redirect(url.toString(), 302);
});

/** Step 2: AliExpress redirects here with ?code=...&state=... (uuid optional). */
oauth.get("/aliexpress/callback", async (c) => {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const uuid = c.req.query("uuid") ?? undefined;
  if (!code) return c.json({ error: "Missing required parameter: code" }, 400);
  if (!state || !(await c.env.KV.get(`oauth:state:${state}`))) return c.json({ error: "Invalid or expired state" }, 400);
  await c.env.KV.delete(`oauth:state:${state}`);
  try {
    await exchangeCode(c.env, code, uuid);
  } catch (err) {
    console.error("token exchange failed", err);
    return c.json({ error: "Token exchange failed", detail: (err as Error).message }, 502);
  }
  return c.json({ ok: true, token: await tokenHealth(c.env) });
});

oauth.get("/aliexpress/health", requireAdmin, async (c) => c.json(await tokenHealth(c.env)));
