# Rizzova Edge

A serverless dropshipping backend on Cloudflare (Workers, D1, KV, Queues, Cron, Images), with AliExpress AE-Dropshipper for supply and Stripe for payment. See [ARCHITECTURE.md](ARCHITECTURE.md) for the design.

> Built by Rizz using AI-assisted development (Claude Code).

## What's in this repo

The Worker (this folder) is the backend. The customer-facing shop is in [`storefront/`](storefront/README.md): Next.js 16, React 19, Tailwind v4.

| Path | Purpose |
|---|---|
| `wrangler.toml` | Worker config: D1, KV, Queue (producer, consumer, DLQ), cron, and a `staging` environment |
| `schema.sql` | D1 schema: tokens, catalogue, variants, images, FTS search, orders, items, fulfilments, webhook idempotency |
| `src/aliexpress/` | Signed IOP client (`fetch` + Web Crypto), OAuth token lifecycle, Dropshipper API calls |
| `src/ingest/` | Product ingester (atomic D1 batch) and Cloudflare Images upload |
| `src/routes/` | `GET /api/products`, `GET /api/products/:slug`, `/api/cart`, `POST /api/checkout`, Stripe webhook, OAuth, admin |
| `src/jobs.ts` | Queue consumer (ingest, fulfil, track) and cron handlers |

## Routes

| Method | Path | Notes |
|---|---|---|
| GET | `/api/products?limit&cursor&category&q` | Keyset pagination, FTS search, edge cached |
| GET | `/api/products/:slug` | Detail with active variants and images |
| GET/POST/DELETE | `/api/cart` | KV cart, `{ variantId, quantity, bundleId? }` (0 removes) |
| POST | `/api/checkout` | `{ email?, shipping? }`: re-prices from D1, applies bundle discounts, creates the order, returns the Stripe Checkout URL |
| POST | `/webhooks/stripe` | Signed; marks the order paid and queues fulfilment |
| GET | `/oauth/aliexpress/start` | Admin; begins AliExpress authorisation |
| GET | `/oauth/aliexpress/callback` | `code` (required), `uuid` (optional), `state` |
| GET | `/oauth/aliexpress/health` | Admin; token expiry metrics |
| POST | `/admin/import` | Admin; `{ "productIds": ["1005…"] }` |
| GET | `/admin/stats` | Admin; product, order and sync-error counts |

Admin routes need `Authorization: Bearer <ADMIN_TOKEN>`.

## Setup

```bash
npm install
npx wrangler login

npx wrangler d1 create rizzova-db                 # copy database_id into wrangler.toml
npx wrangler kv namespace create KV               # copy id into wrangler.toml
npx wrangler queues create rizzova-jobs
npx wrangler queues create rizzova-jobs-dlq
npm run db:migrate:remote

# Secrets (never commit these)
npx wrangler secret put AE_APP_KEY
npx wrangler secret put AE_APP_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put CF_ACCOUNT_ID
npx wrangler secret put CF_IMAGES_API_TOKEN       # token with Cloudflare Images: Edit
npx wrangler secret put ADMIN_TOKEN               # long random string

npm run deploy
```

Then:
1. In the AliExpress developer console, set the app's callback URL to `https://<worker-domain>/oauth/aliexpress/callback`, and open `/oauth/aliexpress/start` once.
2. In Stripe, add a webhook to `https://<worker-domain>/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.expired`.

### Local development

```bash
cp .dev.vars.example .dev.vars    # fill in test values
npm run db:migrate:local
npm run dev
```

## Before going live: check these

- **AliExpress app approval.** The app needs Dropshipper (DS) API permissions, which AliExpress grants after review.
- **Dropshipper field names.** The response fields in `src/aliexpress/dropshipper.ts` follow AliExpress's published DS API. Confirm `aliexpress.ds.product.get`, `aliexpress.ds.order.create` (`param_place_order_request4_open_api_d_t_o`) and `aliexpress.trade.ds.order.get` against your app's **API Test Tool**, and adjust the field names if they differ.
- **Shipping cost.** Shipping is not calculated yet (`shipping_cents = 0`). Add `aliexpress.ds.freight.query`, or a flat rate, before launch.
- **Plan limits and cost.** Check current Cloudflare pricing before deploying:
  - **Cloudflare Images** is a paid add-on.
  - **Queues** and the CPU time needed for ingestion may need the **Workers Paid** plan.
  - **D1, KV and Workers** have free tiers.
- **Legal pages.** Add a refund policy, shipping times and a privacy policy to the storefront.

## Verified locally

These checks ran on Wrangler's local runtime:
- `tsc --noEmit` passes.
- `wrangler deploy --dry-run` builds.
- The schema applies to a local D1.
- Product listing, search and detail work.
- Cart add works, and the stock limit is enforced.
- Checkout writes the order and its items. It is cancelled cleanly when Stripe rejects the key.
- Bundle pricing is applied on the server: a 2-item bundle gets 5% off each line, and the same item bought separately stays at full price.
- A storefront delivery address is saved on the order.
- The OAuth guards reject a missing `code` and a bad `state`.
- The admin guard rejects requests without a token.
- A signed Stripe event marks the order paid and queues fulfilment. A replay and a tampered body are both rejected.

Calls to the real AliExpress, Stripe and Cloudflare Images APIs were **not** tested; that needs live credentials.
