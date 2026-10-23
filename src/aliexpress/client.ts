import type { Env } from "../env";
import { hmacSha256Hex } from "../lib/util";

/**
 * AliExpress Open Platform (IOP gateway) client using plain fetch + Web Crypto.
 *
 * Signing (sign_method=sha256):
 *   1. Take every request parameter except `sign`, sort by key (ASCII).
 *   2. Concatenate key + value for each.
 *   3. System APIs (/rest/...) prefix the API path, e.g. "/auth/token/create".
 *      Business APIs (/sync?method=...) use no prefix.
 *   4. HMAC-SHA256 with the App Secret, hex, UPPER case.
 */
export class AliExpressError extends Error {
  constructor(public code: string, message: string, public requestId?: string) {
    super(`AliExpress ${code}: ${message}`);
  }
}

type Params = Record<string, string | number | boolean | undefined>;

async function sign(secret: string, params: Record<string, string>, apiPath?: string): Promise<string> {
  const base = Object.keys(params)
    .sort()
    .map((k) => k + params[k])
    .join("");
  return (await hmacSha256Hex(secret, (apiPath ?? "") + base)).toUpperCase();
}

function clean(p: Params): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "") out[k] = String(v);
  return out;
}

async function post(url: string, params: Record<string, string>): Promise<any> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=utf-8" },
    body: new URLSearchParams(params),
  });
  const text = await res.text();
  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AliExpressError(String(res.status), `Non-JSON response: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new AliExpressError(String(res.status), body?.message ?? text.slice(0, 200), body?.request_id);
  // Gateway-level errors come back as { code, message, request_id } with code !== "0".
  if (body?.code !== undefined && String(body.code) !== "0") {
    throw new AliExpressError(String(body.code), body.message ?? "error", body.request_id);
  }
  return body;
}

/** System API, e.g. /auth/token/create, /auth/token/refresh. */
export async function callSystem(env: Env, apiPath: string, apiParams: Params): Promise<any> {
  const params = clean({
    app_key: env.AE_APP_KEY,
    timestamp: Date.now(),
    sign_method: "sha256",
    ...apiParams,
  });
  params.sign = await sign(env.AE_APP_SECRET, params, apiPath);
  return post(`${env.AE_GATEWAY}/rest${apiPath}`, params);
}

/** Business API, e.g. method=aliexpress.ds.product.get. Returns the `<method>_response` payload. */
export async function callBusiness(env: Env, method: string, accessToken: string, apiParams: Params): Promise<any> {
  const params = clean({
    app_key: env.AE_APP_KEY,
    timestamp: Date.now(),
    sign_method: "sha256",
    method,
    access_token: accessToken,
    ...apiParams,
  });
  params.sign = await sign(env.AE_APP_SECRET, params);
  const body = await post(`${env.AE_GATEWAY}/sync`, params);
  const key = method.replace(/\./g, "_") + "_response";
  const payload = body[key];
  if (!payload) throw new AliExpressError("no_payload", `Missing ${key} in response`, body?.request_id);
  return payload;
}
