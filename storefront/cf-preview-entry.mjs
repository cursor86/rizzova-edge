// Preview deploy entry: serves the built static files from KV (STATIC) and passes everything else
// to the OpenNext worker. Used because this build environment cannot use Wrangler's asset upload.
// The normal production deploy (`npm run deploy:cf`) uses Workers static assets instead.
import openNext from "./.open-next/worker.js";

const STATIC_PREFIXES = ["/_next/static/", "/brand/"];

async function fromKv(env, request, pathname) {
  const key = decodeURIComponent(pathname.replace(/^\/+/, ""));
  if (!key) return null;
  const { value, metadata } = await env.STATIC.getWithMetadata(key, "arrayBuffer");
  if (!value) return null;
  const headers = new Headers({
    "content-type": metadata?.ct ?? "application/octet-stream",
    "cache-control": key.startsWith("_next/static/") ? "public, max-age=31536000, immutable" : "public, max-age=3600",
    "accept-ranges": "bytes",
  });
  // Byte ranges: Safari/iOS will not play video without them.
  const range = request?.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const size = value.byteLength;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    if (Number.isNaN(start) || start < 0) start = 0;
    if (end >= size) end = size - 1;
    if (start > end) return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
    headers.set("content-range", `bytes ${start}-${end}/${size}`);
    return new Response(value.slice(start, end + 1), { status: 206, headers });
  }
  return new Response(value, { headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if ((request.method === "GET" || request.method === "HEAD") && STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      const hit = await fromKv(env, request, url.pathname);
      if (hit) return hit;
    }
    // Shim for code paths that expect the Workers assets binding.
    const ASSETS = {
      fetch: async (input) => {
        const req = input instanceof Request ? input : new Request(String(input));
        return (await fromKv(env, req, new URL(req.url).pathname)) ?? new Response("Not found", { status: 404 });
      },
    };
    return openNext.fetch(request, { ...env, ASSETS }, ctx);
  },
};
