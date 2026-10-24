# Rizzova Edge – where we are (handover for a new session)

Updated 24 Oct 2026. Start a new session with: "Read RESUME.md in cursor86/rizzova-edge and continue."

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
4. Stripe: the owner adds `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` in Cloudflare; webhook URL `/webhooks/stripe`.
5. Point the storefront at the backend (`RIZZOVA_API_URL`), then take real orders.
6. Hostinger WooCommerce shop stays live until then (paid until 20 Aug 2027).

## Owner preferences
- Owner name appears only on her CV. Use "Rizz" everywhere else.
- Zero spend without explicit approval. Never ask for secrets in chat.
- No change-of-mind returns; Australian Consumer Law guarantees kept.
- Contact: support@rizzova.com, +61 414 017 386, ABN 77 403 370 861.
