# Rizzova Edge – where we are (handover for a new session)

Updated 27 Oct 2026. Start a new session with: "Read RESUME.md in cursor86/rizzova-edge and continue."

## ⭐ Start here (next session)
**Status:** shop, backend, AliExpress and Stripe (test mode) all work end to end.
Test order RZ-240001 was paid with Stripe's test card, the webhook marked it `paid`, and the customer landed on `/order/<id>`.
The storefront still *browses* the old rizzova.com catalogue (preview mode), because only 1 product is imported into D1.

**Do next, in order:**
1. **Import real products** into D1: pick Black Friday products (rules: 2.5–4x markup, supplier shipping ≤ ~$3, 4.7★+, 500+ orders,
   ships to AU and US, no clothing sizes / fragile / liquids / loose batteries). Check each with `ds.freight.query` for AU, US, AE, then
   `POST /admin/import {"productIds":[...]}`. Get the owner's OK on the list first.
2. **Approve product copy** written by Rizz AI: `GET https://rizz-ai.rizzdigital.workers.dev/v1/product-copy` then
   `POST /v1/product-copy/review {"approve":"all"}` (after a quick look).
3. **Switch the storefront to live checkout:** set `RIZZOVA_API_URL=https://rizzova-edge.rizzdigital.workers.dev` on the
   `rizzova-storefront` Worker and redeploy. The shop then lists D1 products and takes Stripe payments.
4. **Go live with money:** owner swaps `STRIPE_SECRET_KEY` on rizzova-edge for the live key, then call `POST /admin/stripe/setup`
   (creates the live webhook automatically). Set `AUTO_FULFIL = "on"` in wrangler.toml so paid live orders go to AliExpress.
   Test-mode payments never place AliExpress orders.
5. AliExpress app is in **Test** status (refresh token lasts ~2 days, auto-refreshed every 15 min). Apply for Online status.

**Admin token:** never stored in the repo or chat. If you need one, make a new one (Cloudflare access is proxy-injected):
`python3 -c "import secrets;print(secrets.token_urlsafe(32))" > /tmp/t; npx wrangler secret put ADMIN_TOKEN < /tmp/t;
(cd rizz-ai && npx wrangler secret put RIZZ_AI_TOKEN < /tmp/t)` then use `Authorization: Bearer $(cat /tmp/t)`.
Env for wrangler: `CLOUDFLARE_API_TOKEN=proxy-injected CLOUDFLARE_ACCOUNT_ID=bee7d2e080270ecebe14549aecd7db36`.

**Stripe admin routes:** `GET /admin/stripe/status` (shows test/live/missing, never values), `POST /admin/stripe/setup`.

**Owner prefers:** short answers, few screenshots (save usage), no fake reviews or "was" prices, zero spend without asking.

## Saving usage
- graphify is set up (`CLAUDE.md`, `.claude/`): ask the code map first (`graphify query "..."`) instead of reading files.
  A new cloud session installs graphify automatically. After code changes run `graphify update .` (free, no AI).

## Live
- **Storefront (preview):** https://rizzova-storefront.rizzdigital.workers.dev
  - Next.js 16.4.2 in `storefront/`, purple/gold Rizzova brand, minimalist home (`components/quiet/`, drinkstill.nz style), policy pages.
  - Preview mode reads the rizzova.com WooCommerce feed (cached in KV). Checkout is a demo.
  - Deploy: `cd storefront && CLOUDFLARE_API_TOKEN=proxy-injected CLOUDFLARE_ACCOUNT_ID=bee7d2e080270ecebe14549aecd7db36 ./scripts/deploy-preview.sh`
    (assets go to KV because Wrangler's asset upload fails behind the session proxy).
- **Backend:** https://rizzova-edge.rizzdigital.workers.dev (Worker in repo root)
  - D1 `rizzova-db`, KV, Queue `rizzova-jobs` + DLQ, 3 crons. All on the free plan.
  - Secrets set: `ADMIN_TOKEN`, `AE_APP_KEY` (555396), `AE_APP_SECRET`.
  - The admin token is not stored in the repo; reset it with `wrangler secret put ADMIN_TOKEN` if lost.
  - Product images use supplier URLs (no paid Cloudflare Images).

## Rizz AI (Workers AI, no Claude usage)
- https://rizz-ai.rizzdigital.workers.dev (folder `rizz-ai/`), model in `MODEL` var, same D1 as the backend.
- Bearer `RIZZ_AI_TOKEN` (same value as the backend admin token). Public: `POST /v1/support` (20/hour per visitor, CORS to the store).
- `POST /v1/product-copy/run {limit}` writes drafts into `product_copy`; cron does 10 every 6 hours.
  `GET /v1/product-copy?status=draft` to review, `POST /v1/product-copy/review {approve:[ids]|"all", reject:[ids]}`.
  Only approved copy shows on the store.
- Also `POST /v1/caption {brand, topic, platform?, count?}`, `/v1/email {brand, purpose, points?}`, `/v1/summarise {text}`.

## AliExpress
- App 555396 "Drop Shipping", status Test, DS permission group Active.
- Signing verified: `GET /admin/ae-selftest` returns `signatureOk: true`.
- **NEXT:** the owner opens `/oauth/aliexpress/start?admin_token=…`, clicks Buyer login, then Authorise,
  then checks `/oauth/aliexpress/health`.
- Real DS API names (from the console): `aliexpress.ds.product.get`, `aliexpress.ds.feed.itemids.get` (promo feeds),
  `aliexpress.ds.category.get`, `aliexpress.ds.freight.query`, `aliexpress.ds.order.create`,
  `aliexpress.trade.ds.order.get`, `aliexpress.ds.order.tracking.get`.
  - TODO: switch tracking to `order.tracking.get` and add the feed import, after checking the field names
    with the console's API test tool.

## To do (in order)
1. Connect AliExpress (above), then import 3–5 test products via `POST /admin/import` and check prices, photos and variants.
2. Black Friday (27 Nov): pull promo feeds, shortlist products, get the owner's approval, import.
3. Shipping: AU and US free (2–3 weeks), UAE A$5, charged on the server (`src/lib/shipping.ts`, copied in `storefront/lib/shipping.ts`).
   Express A$15 (about 1 week) is built but off (`EXPRESS_ENABLED = false`): the test product has one AU service only
   (Cainiao standard 6–10 days, about A$3) and no US/UAE delivery. Turn it on once products with faster services are imported.
   Products must also be checked with `ds.freight.query` for each country before import.
   Owner rule (24 Oct 2026): supplier shipping up to about $3 per order is fine; the margin absorbs it and delivery stays free to AU/US.
4. Stripe: done in test mode (key set by owner, webhook created by `/admin/stripe/setup`, secret in KV).
5. Point the storefront at the backend (`RIZZOVA_API_URL`), then take real orders.
6. Hostinger WooCommerce shop stays live until then (paid until 20 Aug 2027).

## Owner preferences
- Owner name appears only on her CV. Use "Rizz" everywhere else.
- Zero spend without explicit approval. Never ask for secrets in chat.
- No change-of-mind returns; Australian Consumer Law guarantees kept.
- Contact: support@rizzova.com, +61 414 017 386, ABN 77 403 370 861.
