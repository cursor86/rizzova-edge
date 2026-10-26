# Graph Report - rizzova-edge  (2026-10-26)

## Corpus Check
- 84 files · ~30,224 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .example 2, (none) 2, .toml 2)

## Summary
- 484 nodes · 1040 edges · 20 communities (15 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ccfba8d2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app/page.tsx
- product.ts
- catalog.ts
- next
- storefront/package.json
- checkout-form.tsx
- Rizzova Edge
- checkout.ts
- cart-context.tsx
- compilerOptions
- package.json
- rizz-ai/src/index.ts
- compilerOptions
- Rizzova Edge – where we are (handover for a new session)
- rizz-ai/tsconfig.json
- marquee.tsx
- CLAUDE.md
- .claude/CLAUDE.md
- deploy-preview.sh

## God Nodes (most connected - your core abstractions)
1. `next` - 26 edges
2. `formatMoney()` - 25 edges
3. `Product` - 23 edges
4. `react` - 21 edges
5. `compilerOptions` - 18 edges
6. `useCart()` - 17 edges
7. `lucide-react` - 17 edges
8. `motion` - 17 edges
9. `now()` - 16 edges
10. `Env` - 15 edges

## Surprising Connections (you probably didn't know these)
- `What's in this repo` --references--> `fetch()`  [INFERRED]
  README.md → storefront/cf-preview-entry.mjs
- `Machine-readable pages` --references--> `Product`  [INFERRED]
  storefront/README.md → storefront/lib/types.ts
- `CategoryFeature` --references--> `Product`  [EXTRACTED]
  storefront/components/editorial/split-feature.tsx → storefront/lib/types.ts
- `getDsCategories()` --calls--> `callBusiness()`  [EXTRACTED]
  src/aliexpress/dropshipper.ts → src/aliexpress/client.ts
- `CheckoutPage()` --calls--> `CheckoutForm()`  [EXTRACTED]
  storefront/app/checkout/page.tsx → storefront/components/checkout/checkout-form.tsx

## Import Cycles
- None detected.

## Communities (20 total, 5 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.09
Nodes (58): lucide-react, motion, react, HomePage(), shelves(), withImage(), CartSheet(), BrandFilm() (+50 more)

### Community 1 - "product.ts"
Cohesion: 0.08
Nodes (56): hono, exchangeCode(), expiry(), getAccessToken(), persist(), REFRESH_WINDOW_MS, refreshToken(), tokenHealth() (+48 more)

### Community 2 - "catalog.ts"
Cohesion: 0.07
Nodes (34): generateMetadata(), Params, ProductPage(), MediaGallery(), MediaItem, Props, SpecPanel(), HUES (+26 more)

### Community 3 - "next"
Cohesion: 0.08
Nodes (25): next, metadata, dynamicParams, generateMetadata(), Page(), Params, body, display (+17 more)

### Community 4 - "storefront/package.json"
Cohesion: 0.06
Nodes (38): @opennextjs/cloudflare, react-dom, server-only, tailwindcss, @tailwindcss/postcss, @types/node, @types/react, @types/react-dom (+30 more)

### Community 5 - "checkout-form.tsx"
Cohesion: 0.09
Nodes (31): POST(), reply(), CheckoutPage(), metadata, CheckoutForm(), emptyContact, emptyDelivery, Step (+23 more)

### Community 6 - "Rizzova Edge"
Cohesion: 0.07
Nodes (24): 1. Token acquisition, 2. Product ingestion, 3. Checkout and tracking, Edge caching, Framework choice, Rizzova Edge: architecture, System map, Before going live: check these (+16 more)

### Community 7 - "checkout.ts"
Cohesion: 0.11
Nodes (15): BUNDLE_MAX_ADDONS, bundleRate(), discountedUnit(), isValidBundleId(), EXPRESS_ENABLED, SHIPPING_ZONES, ShippingMethod, shippingOption (+7 more)

### Community 8 - "cart-context.tsx"
Cohesion: 0.16
Nodes (20): Action, AddInput, addLine(), CartContext, CartContextValue, CartLine, CartProvider(), CartTotals (+12 more)

### Community 9 - "compilerOptions"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 10 - "package.json"
Cohesion: 0.12
Nodes (18): dependencies, hono@4.6.14, devDependencies, @cloudflare/workers-types@4.20241218.0, typescript@5.7.2, wrangler@3.99.0, typescript, wrangler (+10 more)

### Community 11 - "rizz-ai/src/index.ts"
Cohesion: 0.13
Nodes (12): app, Brand, BRANDS, COPY_SCHEMA, Env, fillProductCopy(), mergeAttributes(), Msg (+4 more)

### Community 12 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, lib, module, moduleResolution, noEmit, noUncheckedIndexedAccess, skipLibCheck, strict (+3 more)

### Community 13 - "Rizzova Edge – where we are (handover for a new session)"
Cohesion: 0.29
Nodes (6): AliExpress, Live, Owner preferences, Rizz AI (Workers AI, no Claude usage), Rizzova Edge – where we are (handover for a new session), To do (in order)

### Community 14 - "rizz-ai/tsconfig.json"
Cohesion: 0.50
Nodes (3): ../tsconfig.json, extends, include

## Knowledge Gaps
- **1 isolated node(s):** `../tsconfig.json`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 184 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `app/page.tsx`, `catalog.ts`, `storefront/package.json`, `checkout-form.tsx`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **What connects `../tsconfig.json` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0882716049382716 - nodes in this community are weakly interconnected._
- **Why does `Product` connect `app/page.tsx` to `catalog.ts`, `next`, `Rizzova Edge`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Should `product.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0762680488707886 - nodes in this community are weakly interconnected._
- **Why does `Machine-readable pages` connect `Rizzova Edge` to `app/page.tsx`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `catalog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._