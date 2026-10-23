// Preview deploy entry: serves the built static files from KV (STATIC) and passes everything else
// to the OpenNext worker. Used because this build environment cannot use Wrangler's asset upload.
// The normal production deploy (`npm run deploy:cf`) uses Workers static assets instead.
import openNext from "./.open-next/worker.js";

async function fromKv(env, pathname) {
  const key = decodeURIComponent(pathname.replace(/^\/+/, ""));
  if (!key) return null;
  const { value, metadata } = await env.STATIC.getWithMetadata(key, "arrayBuffer");
  if (!value) return null;
  const immutable = key.startsWith("_next/static/");
  return new Response(value, {
    headers: {
      "content-type": metadata?.ct ?? "application/octet-stream",
      "cache-control": immutable ? "public, max-age=31536000, immutable" : "public, max-age=300",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.startsWith("/_next/static/")) {
      const hit = await fromKv(env, url.pathname);
      if (hit) return hit;
    }
    // Shim for code paths that expect the Workers assets binding.
    const ASSETS = { fetch: async (input) => (await fromKv(env, new URL(input instanceof Request ? input.url : String(input)).pathname)) ?? new Response("Not found", { status: 404 }) };
    return openNext.fetch(request, { ...env, ASSETS }, ctx);
  },
};
