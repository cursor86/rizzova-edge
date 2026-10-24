import type { Env } from "../env";

/**
 * Cloudflare Images "upload via URL". We pass a deterministic custom id so re-syncs are
 * idempotent: an existing id returns a conflict, which we treat as success.
 */
export async function uploadImageFromUrl(env: Env, sourceUrl: string, customId: string): Promise<string> {
  // Without Cloudflare Images configured, keep the supplier URL (free; Images is a paid add-on).
  if (!env.CF_IMAGES_API_TOKEN || !env.CF_IMAGES_ACCOUNT_HASH) return sourceUrl.split("?")[0] ?? sourceUrl;
  const form = new FormData();
  form.set("url", sourceUrl);
  form.set("id", customId);
  form.set("requireSignedURLs", "false");
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/images/v1`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.CF_IMAGES_API_TOKEN}` },
    body: form,
  });
  const body: any = await res.json().catch(() => ({}));
  if (res.ok && body?.success) return body.result.id as string;
  const alreadyExists = (body?.errors ?? []).some((e: any) => e?.code === 5409 || /already exists/i.test(e?.message ?? ""));
  if (alreadyExists) return customId;
  throw new Error(`Images upload failed (${res.status}): ${JSON.stringify(body?.errors ?? body).slice(0, 300)}`);
}

/** Stable id from the source URL: "ae-<productId>-<sha1 prefix>". */
export async function imageIdFor(aeProductId: string, sourceUrl: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(sourceUrl.split("?")[0]));
  const hex = [...new Uint8Array(digest)].slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `ae-${aeProductId}-${hex}`;
}

/** Delivery URL: Cloudflare Images id, or a stored supplier URL when Images is not in use. */
export const imageUrl = (env: Env, imageId: string, variant = "public") =>
  imageId.startsWith("https://") ? imageId : `https://imagedelivery.net/${env.CF_IMAGES_ACCOUNT_HASH}/${imageId}/${variant}`;
