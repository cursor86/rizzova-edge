# Graph Report - rizzova-edge  (2026-10-26)

## Corpus Check
- 86 files · ~31,160 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: .example 2, (none) 2, .toml 2)

## Summary
- 492 nodes · 1055 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `40d61d50`
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
- react
- CLAUDE.md
- .claude/CLAUDE.md
- deploy-preview.sh

## God Nodes (most connected - your core abstractions)
1. `next` - 27 edges
2. `formatMoney()` - 25 edges
3. `Product` - 23 edges
4. `react` - 22 edges
5. `useCart()` - 19 edges
6. `lucide-react` - 18 edges
7. `compilerOptions` - 18 edges
8. `motion` - 17 edges
9. `now()` - 16 edges
10. `Env` - 15 edges

## Surprising Connections (you probably didn't know these)
- `What's in this repo` --references--> `fetch()`  [INFERRED]
  README.md → storefront/cf-preview-entry.mjs
- `Machine-readable pages` --references--> `Product`  [INFERRED]
  storefront/README.md → storefront/lib/types.ts
- `getDsCategories()` --calls--> `callBusiness()`  [EXTRACTED]
  src/aliexpress/dropshipper.ts → src/aliexpress/client.ts
- `CheckoutPage()` --calls--> `CheckoutForm()`  [EXTRACTED]
  storefront/app/checkout/page.tsx → storefront/components/checkout/checkout-form.tsx
- `RootLayout()` --calls--> `SiteHeader()`  [EXTRACTED]
  storefront/app/layout.tsx → storefront/components/site-header.tsx

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "app/page.tsx"
Cohesion: 0.12
Nodes (34): HomePage(), shelves(), withImage(), BrandFilm(), EditorialHero(), LINES, Props, CategoryFeature (+26 more)

### Community 1 - "product.ts"
Cohesion: 0.07
Nodes (57): hono, exchangeCode(), expiry(), getAccessToken(), persist(), REFRESH_WINDOW_MS, refreshToken(), tokenHealth() (+49 more)

### Community 2 - "catalog.ts"
Cohesion: 0.09
Nodes (30): generateMetadata(), Params, ProductPage(), MediaGallery(), MediaItem, SpecPanel(), api(), ApiDetail (+22 more)

### Community 3 - "next"
Cohesion: 0.12
Nodes (16): next, metadata, dynamicParams, generateMetadata(), Page(), Params, Collage(), SLOTS (+8 more)

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
Cohesion: 0.10
Nodes (29): body, display, metadata, mono, poster, RootLayout(), serif, SiteFooter() (+21 more)

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
Cohesion: 0.22
Nodes (8): AliExpress, Live, Owner preferences, Rizz AI (Workers AI, no Claude usage), Rizzova Edge – where we are (handover for a new session), Saving usage, ⭐ Start here (next session), To do (in order)

### Community 14 - "rizz-ai/tsconfig.json"
Cohesion: 0.50
Nodes (3): ../tsconfig.json, extends, include

### Community 15 - "react"
Cohesion: 0.12
Nodes (32): lucide-react, motion, react, ClearCart(), metadata, OrderPage(), CartSheet(), Props (+24 more)

## Knowledge Gaps
- **1 isolated node(s):** `../tsconfig.json`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 188 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `app/page.tsx`, `catalog.ts`, `storefront/package.json`, `checkout-form.tsx`, `cart-context.tsx`, `react`?**
  _High betweenness centrality (0.096) - this node is a cross-community bridge._
- **What connects `../tsconfig.json` to the rest of the system?**
  _1 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11734693877551021 - nodes in this community are weakly interconnected._
- **Why does `Product` connect `app/page.tsx` to `catalog.ts`, `next`, `Rizzova Edge`, `react`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `product.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0745945945945946 - nodes in this community are weakly interconnected._
- **Why does `Machine-readable pages` connect `Rizzova Edge` to `app/page.tsx`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `catalog.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08636977058029689 - nodes in this community are weakly interconnected._