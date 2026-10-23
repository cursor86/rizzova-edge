import type { Env } from "../env";
import { callSystem } from "./client";
import { now } from "../lib/util";

const TOKEN_ROW = "aliexpress";
const KV_TOKEN = "ae:access_token";
export const REFRESH_WINDOW_MS = 24 * 60 * 60 * 1000; // refresh when < 24h left

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number | string;          // seconds
  refresh_expires_in?: number | string;  // seconds
  expire_time?: number | string;         // epoch ms (newer gateway versions)
  refresh_token_valid_time?: number | string;
  user_id?: string;
  account?: string;
}

function expiry(abs: number | string | undefined, relSeconds: number | string | undefined): number | null {
  if (abs) return Number(abs);
  if (relSeconds) return now() + Number(relSeconds) * 1000;
  return null;
}

async function persist(env: Env, t: TokenResponse): Promise<string> {
  const expiresAt = expiry(t.expire_time, t.expires_in) ?? now() + 12 * 3600_000;
  const refreshAt = expiry(t.refresh_token_valid_time, t.refresh_expires_in);
  await env.DB.prepare(
    `INSERT INTO auth_tokens (id, access_token, refresh_token, expires_at, refresh_expires_at, ae_user_id, account, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     ON CONFLICT(id) DO UPDATE SET access_token=excluded.access_token, refresh_token=excluded.refresh_token,
       expires_at=excluded.expires_at, refresh_expires_at=excluded.refresh_expires_at,
       ae_user_id=COALESCE(excluded.ae_user_id, auth_tokens.ae_user_id), account=COALESCE(excluded.account, auth_tokens.account),
       updated_at=excluded.updated_at`,
  )
    .bind(TOKEN_ROW, t.access_token, t.refresh_token, expiresAt, refreshAt, t.user_id ?? null, t.account ?? null, now())
    .run();
  // Hot copy in KV, expiring a minute before the real token.
  const ttl = Math.max(60, Math.floor((expiresAt - now()) / 1000) - 60);
  await env.KV.put(KV_TOKEN, t.access_token, { expirationTtl: ttl });
  return t.access_token;
}

/** OAuth callback: exchange `code` (+ optional `uuid`) for tokens via /auth/token/create. */
export async function exchangeCode(env: Env, code: string, uuid?: string): Promise<void> {
  const t: TokenResponse = await callSystem(env, "/auth/token/create", { code, uuid });
  if (!t.access_token || !t.refresh_token) throw new Error("Token response missing access_token/refresh_token");
  await persist(env, t);
}

export async function refreshToken(env: Env): Promise<void> {
  const row = await env.DB.prepare(`SELECT refresh_token FROM auth_tokens WHERE id = ?1`).bind(TOKEN_ROW).first<{ refresh_token: string }>();
  if (!row) throw new Error("No AliExpress authorisation yet. Visit /oauth/aliexpress/start");
  const t: TokenResponse = await callSystem(env, "/auth/token/refresh", { refresh_token: row.refresh_token });
  await persist(env, t);
}

/** Valid access token: KV hit, else D1, refreshing when inside the window. */
export async function getAccessToken(env: Env): Promise<string> {
  const cached = await env.KV.get(KV_TOKEN);
  if (cached) return cached;
  const row = await env.DB.prepare(`SELECT access_token, expires_at FROM auth_tokens WHERE id = ?1`)
    .bind(TOKEN_ROW)
    .first<{ access_token: string; expires_at: number }>();
  if (!row) throw new Error("No AliExpress authorisation yet. Visit /oauth/aliexpress/start");
  if (row.expires_at - now() < REFRESH_WINDOW_MS) {
    await refreshToken(env);
    return (await env.KV.get(KV_TOKEN)) ?? row.access_token;
  }
  return row.access_token;
}

/** Token health metrics for monitoring (cron + admin endpoint). */
export async function tokenHealth(env: Env) {
  const row = await env.DB.prepare(`SELECT expires_at, refresh_expires_at, updated_at, account FROM auth_tokens WHERE id = ?1`)
    .bind(TOKEN_ROW)
    .first<{ expires_at: number; refresh_expires_at: number | null; updated_at: number; account: string | null }>();
  if (!row) return { authorised: false as const };
  return {
    authorised: true as const,
    account: row.account,
    accessExpiresInHours: +((row.expires_at - now()) / 3600_000).toFixed(1),
    refreshExpiresInDays: row.refresh_expires_at ? +((row.refresh_expires_at - now()) / 86_400_000).toFixed(1) : null,
    lastRefreshed: new Date(row.updated_at).toISOString(),
  };
}
