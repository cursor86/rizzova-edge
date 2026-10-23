# Rizzova Storefront

The customer-facing store for Rizzova: Next.js 16 (App Router), React 19, Tailwind CSS v4, Motion and Lucide. It reads the catalogue from, and checks out through, the **rizzova-edge** Worker in the parent folder. That Worker owns the data (Cloudflare D1), the pricing and the payment, so the storefront has no database of its own.

## Design

The look is dark glass panels with neo-brutalist accents. Tokens live in two places:
- **`app/globals.css`** (`@theme`): colours, fonts, radii, the hard offset shadow, and the `glass`, `glass-strong` and `btn-brutal` utilities.
- **`lib/tokens.ts`**: blur and opacity constants plus three spring presets for motion (`snappy`, `soft`, `pop`).

All motion respects "reduce motion".

## What's here

| Area | Files |
|---|---|
| Layout, sticky glass header, expanding search (`/` to focus), animated cart badge, cart drawer | `app/layout.tsx`, `components/site-header.tsx`, `search-bar.tsx`, `cart-sheet.tsx` |
| Asymmetric masonry grid and glass cards with option chips on hover/focus | `components/product-grid.tsx`, `product-card.tsx` |
| Product page: media gallery, tabbed specifications, purchase panel, Smart Bundle | `app/product/[slug]/page.tsx`, `components/pdp/*` |
| Cart state: bundle pricing, per-variant stock checks across lines, saved per browser | `context/cart-context.tsx`, `lib/bundle.ts` |
| Three-step checkout (contact, delivery, review) with Zod validation and privacy-safe funnel events | `components/checkout/*`, `lib/checkout-schema.ts`, `lib/telemetry.ts` |
| Checkout handoff to the Worker, which then hands off to Stripe | `app/api/checkout/route.ts` |

### Bundle pricing

- 2 items: 5% off. 3 items: 10% off. 4 items: 15% off.
- `lib/bundle.ts` mirrors `../src/lib/bundle.ts`, and **the Worker's copy decides the price at checkout**. Keep the two in sync.
- Suggestions are rule-based: same category first, then other in-stock items.

### Machine-readable pages

- Product pages embed schema.org `Product` / `AggregateOffer` JSON-LD.
- Cards carry microdata, so search engines and AI shopping agents can read price and stock.

## Run

```bash
npm install
cp .env.example .env.local   # set RIZZOVA_API_URL to the Worker URL, or leave it empty for preview mode
npm run dev
```

With no `RIZZOVA_API_URL`, the store shows a labelled **sample catalogue**, and checkout runs in **preview mode**, which never creates an order or takes payment.

To deploy on Cloudflare Workers, use the OpenNext adapter (`@opennextjs/cloudflare`).

## Verified

- **Build:** `tsc --noEmit` (strict, no implicit any) and `next build` pass on **Next.js 16.4.2**. 16.4.0 had two critical and one high advisory, fixed from 16.4.1.
- **Browser test (Playwright), desktop and phone:**
  - add to cart from a card;
  - option switching with the low-stock message;
  - adding a 4-item bundle (totals checked to the cent);
  - the cart drawer;
  - checkout validation, including focus moving to the first error and a bad postcode;
  - preview order placed;
  - no console errors and no sideways scrolling at 390px.
