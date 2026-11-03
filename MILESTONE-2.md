# Milestone 2: Product catalogue and categories

Implemented locally; no commit, push, deployment, backend calls, or later milestones.

## Features and architecture

- Category directory, category results, breadcrumbs, and invalid-route feedback.
- Shared product cards with prices, discounts, availability, and detail links.
- Search, category, price range, availability, three sort modes, clear filters, eight-item pagination.
- URL parameters: q, category, min, max, available, sort, page. Filter/sort updates reset pagination; Back/Forward restores listing query state.
- Product details: image gallery controls, quantity bounded by stock, specifications, savings, related products, disabled Add to Cart placeholder.
- Shared header, newsletter and footer. Homepage sections/assets retained; search opens catalogue and product clicks open details instead of claiming cart additions.
- Typed mock adapter extends homepage fixtures. Existing Redux provider, store and typed hooks preserved; added catalogue async loading/error/retry slice. URL state is not duplicated in Redux.
- No dependencies added. No router existed; native anchors handle page navigation and History API handles query changes. Production hosting needs SPA fallback to index.html.
- Strict TypeScript enabled; responsive CSS, form labels, focus states, breadcrumbs, skip link, status/error announcements.

## Routes

| Route | Purpose |
| --- | --- |
| / | Existing homepage |
| /categories | Category directory |
| /categories/:id | Category listing |
| /catalogue | All products/search |
| /products/:id | Product details |

## Files

Created: src/features/catalogue/{types,data,query,slice}.ts; src/components/catalogue/{CategoryCard,ProductCard}.tsx; src/components/{StoreHeader,StoreFooter}.tsx; src/pages/CataloguePage.tsx; tests/{catalogue,components}.test.mjs; MILESTONE-2.md.

Modified: src/App.tsx, src/App.css, src/app/store.ts, src/pages/HomePage.tsx, src/components/home/ProductSection.tsx, package.json, tsconfig.app.json, README.md. Assets and AGENTS.md unchanged.

## Validation

- npm test: 14 passed using Node 24 built-in runner and existing Vite SSR/React server rendering. No test framework was previously configured.
- npm run typecheck: passed with strict TypeScript.
- npm run lint: passed.
- npm run build: passed (TypeScript and Vite bundle).
- Coverage: search, combined filtering, sort modes, pagination bounds, empty results, data/asset consistency, rendered navigation targets, categories/details, loading/error/retry markup, homepage sections.
- Static component rendering does not verify browser events, visual fidelity, responsive layout or screen-reader behaviour. No browser automation or accessibility audit tool is available here. These checks remain manual; the full definition of done is not yet verified.

## Limitations and remaining work

- One supplied image per product; gallery supports more when available. Additional angles are not fabricated.
- Product descriptions, stock, specifications, ratings and pricing are illustrative mock data.
- Screenshot seller/review/variant workflows lack data and are outside this milestone. No fabricated reviews or policy promises were added.
- Backend, cart, checkout and account remain future work.
- Complete browser interaction, responsive comparison, and accessibility checks below before approval.

## Manual QA checklist (pending)

- [ ] Check 375px, 768px, 1440px layouts for overflow, readable filters/cards/details and footer.
- [ ] Follow homepage categories, product cards, related products, breadcrumbs and View All.
- [ ] Submit header search; combine filters and sorting; confirm matching products and URL.
- [ ] Change filters from page two; verify reset, reload and Back/Forward restoration.
- [ ] Check missing routes, no results, reversed price range and out-of-stock products.
- [ ] Verify quantity buttons/input limits and disabled cart messaging.
- [ ] Keyboard-check skip link, navigation, filters, gallery, quantity and focus states.
- [ ] Compare category/detail pages to supplied screenshots; regression-check homepage banners, sections, newsletter and notices.
- [ ] Verify hosting serves deep links after refresh.

## Prepared pull request

Title: Add product catalogue, category browsing and product details

Adds category and product routes within the existing React/Redux/Vite architecture using mock data and existing assets. Reuses cards and store chrome; adds URL-backed search/filter/sort/pagination, loading/error/empty states and stock-aware product details. Homepage links open catalogue destinations; cart controls clearly show coming-soon status. No backend or checkout functionality.

Validation: 14 catalogue and rendered-component tests, strict TypeScript, ESLint and production build. Browser interaction, responsive visual QA and accessibility audit remain pending; gallery uses the single available image per product.
