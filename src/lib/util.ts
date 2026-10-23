const enc = new TextEncoder();

export const now = () => Date.now();

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function slugify(input: string, suffix: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80)
    .replace(/-+$/, "");
  return `${base || "product"}-${suffix}`;
}

/** Major-unit price string ("12.34") -> integer cents. */
export function toCents(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** Retail price from cost: cost x markup, rounded up to the next .99. */
export function retailFromCost(costCents: number, markup: number): number {
  const raw = Math.ceil(costCents * markup);
  return Math.max(99, Math.ceil((raw + 1) / 100) * 100 - 1);
}

/** Very small allow-list HTML sanitiser for supplier descriptions (drops scripts, styles, iframes, handlers). */
export function sanitizeHtml(html: string | undefined): string | null {
  if (!html) return null;
  return html
    .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|link|meta)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "")
    .slice(0, 100_000);
}

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), { ...init, headers: { "content-type": "application/json; charset=utf-8", ...(init.headers ?? {}) } });

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
