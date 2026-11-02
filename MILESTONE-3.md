# Milestone 3 — Shopping cart and demo checkout

Implemented within the existing React/TypeScript/Vite application, preserving the catalogue Redux slice, mock products, currency formatter, storefront assets, and path-based routing. No dependencies, backend APIs, payments, account features, or admin dashboard were added.

## Behaviour and architecture

- Product cards on the homepage/catalogue and product details add to the same Redux cart. Header displays total units. Cards retain a separate product link so buttons are keyboard accessible without nested interactive elements.
- Cart supports stock-bounded integer quantities, removal, clearing, empty state, line totals and continue-shopping links.
- State: `catalogue` remains unchanged; `cart: { items: [{ productId, variantId, quantity }] }`; `checkout: { status, error?, order? }`. Checkout status is idle, submitting, success or error.
- Stable product/variant keys distinguish items. Only `default` is supported because catalogue variants do not exist yet. Unknown variants cannot bypass stock limits.
- Prices and stock come from the existing typed mock catalogue. Money is calculated in integer kobo and converted to naira only for the existing formatter. Subtotal equals final total: no invented shipping, tax or discount policies.
- Cart identifiers/quantities persist under `cadna-cart-v1` in localStorage. Restore validates entries, merges duplicates, drops missing/out-of-stock products and caps stock. Storage errors do not crash shopping; purchase pages show a warning when saving fails. Prices and customer information are not persisted.
- Checkout uses labelled native fields, autocomplete, required-field/email/phone validation, linked errors and focus on the first invalid field. Optional instructions are supported. Submission is guarded synchronously in the form and in the Redux thunk.
- A local delayed service produces a UUID demo reference, snapshots customer and order information, and clears the cart only after success. Errors preserve the cart and enable retry. The service is injectable through Redux thunk extra arguments for deterministic failure tests.
- Confirmation is retained in Redux during this visit; the checkout-to-confirmation transition uses the existing History API conventions. A refresh or full navigation discards the confirmation and shows a helpful fallback. No live order, payment or delivery occurs.

## Routes

- `/cart`: cart management.
- `/checkout`: validated demo checkout, guarded for an empty cart.
- `/order-confirmation`: successful demo order or missing-confirmation fallback.

Existing homepage, catalogue, category, product and URL search/filter/sort routes remain in place. Hosting must use the existing SPA fallback to index.html.

## Files created

- `src/features/cart/slice.ts`: actions, selectors, stable keys and minor-unit calculations.
- `src/features/cart/persistence.ts`: safe storage and restore validation.
- `src/features/checkout/slice.ts`: validation, types, async demo submission and order state.
- `src/components/cart/AddToCartButton.tsx`: reusable stock-aware action and status.
- `src/components/cart/OrderSummary.tsx`: reusable checkout/cart review.
- `src/pages/CartPage.tsx`, `CheckoutPage.tsx`, `ConfirmationPage.tsx`, `PurchasePage.tsx`: purchase pages and shared storefront shell.
- `tests/cart-checkout.test.mjs`: cart, storage, checkout and rendered-route tests.
- `MILESTONE-3.md`: delivery notes and prepared PR summary.

## Files modified for this milestone

- `src/App.tsx`: purchase routes and History API updates.
- `src/app/store.ts`: register cart/checkout, restore and subscribe to persistence, inject local service.
- `src/components/StoreHeader.tsx`: linked live cart count.
- `src/components/catalogue/ProductCard.tsx`: reusable add action alongside product link.
- `src/pages/CataloguePage.tsx`: enable detail-page cart action, enforce integer quantity.
- `src/App.css`: responsive purchase layouts, form/errors and summary styles.
- `tests/components.test.mjs`: replace obsolete disabled-cart expectation with enabled action coverage; disable test HMR.
- `README.md`: link this milestone.

Pre-existing uncommitted Milestone 2 work was preserved. AGENTS.md retains its existing instructions; the user's explicit Milestone 3 request authorizes this work.

## Validation

Uses the existing Node test runner, Vite SSR and React server-rendering tools. Automated tests cover adding/merging/removing, increasing/decreasing, invalid quantities, stock, integer totals, persistence/refresh, corrupt or blocked storage, empty states, required fields/email/phone, duplicate submission, successful mock checkout, failure/retry, failure preservation and successful cart clearing. Existing homepage, category navigation, product details, search, filtering and sorting tests remain included.

Commands: `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`. The `.cmd` executable avoids this Windows host's PowerShell npm.ps1 execution restriction. Actual final results are recorded below after validation.

Tests render markup and exercise Redux/services; they do not drive browser events. No browser automation/preview tool is available in this session. Visual responsiveness, keyboard interaction and full browser regressions remain manual. Vite's concurrent SSR test servers can emit a non-fatal WebSocket port warning.

## Manual review

1. Run `npm.cmd run dev`. Check 375px, 768px and desktop layouts.
2. Add from homepage, catalogue and details. Repeat additions; verify header units and combined line. Try an out-of-stock product.
3. Open cart, increase/decrease/edit quantities; try zero, negative, decimal and above-stock values. Verify limits, line totals and summary. Remove and clear; verify empty states.
4. Add again and refresh; confirm cart survives. Disable localStorage in browser settings and check purchase-page warning. Re-enable storage afterwards.
5. Open checkout empty; verify guard. With items, submit blank fields and invalid email/phone. Verify labels, error associations and first-invalid-field focus.
6. Fill all required fields, optionally add instructions. Submit repeatedly; verify progress, single demo reference, correct review/customer details and cleared cart. Verify clear demonstration messaging.
7. Refresh confirmation; verify the documented missing-confirmation state. Return to catalogue.
8. Keyboard-check skip link, header, product links/buttons, quantity controls and checkout. Verify visible focus and no horizontal overflow.
9. Regression-check homepage sections, category links, details/gallery, header search, combined filters, sorting, pagination and Back/Forward behaviour.
10. Failure path is exercised through an injected rejecting service in automated tests; the default demo service succeeds locally and has no artificial failure toggle.

## GitHub delivery

Requested development branch: `feature/cart-checkout`; target: `develop`. This checkout started on `feature/homepage` with substantial uncommitted Milestone 2 work. Branch creation needed an elevated Git metadata write and was rejected; changes remain uncommitted on the original branch. No commit, push, merge or hosted PR was performed. Resolve the branch and Milestone 2 baseline before staging; do not accidentally include unrelated existing changes.

### Prepared pull request

Title: Add persisted shopping cart and validated demo checkout

Target: develop

Overview: Connect existing product views and navigation to a persisted Redux cart, then let customers review and submit a validated local demonstration order. Stock limits and integer-kobo totals apply throughout. Successful mock submission generates a reference and confirmation before the cart is cleared; failures preserve it.

Features: reusable add-to-cart and order-review components; quantity/removal/clear actions; refresh-safe cart; accessible checkout fields and errors; guarded async submission; demo confirmation and responsive storefront styling.

Screenshots: none captured; browser visual review pending.

Tests: see final validation below. No backend endpoints or payment services used.

Known issues: customer/order confirmation is session-memory-only; no actual shipping/tax/payment policy; current catalogue supports default variant only; cross-tab cart synchronization is not implemented; browser QA remains pending.

Review checklist:
- [ ] Establish the correct feature branch and review preserved Milestone 2 baseline.
- [ ] Run required automated checks.
- [ ] Complete mobile/tablet/desktop and keyboard checks above.
- [ ] Verify cart persistence, stock limits, validation and demo messaging.
- [ ] Confirm no secrets, APIs, payment gateway or unrelated features are included.
- [ ] Submit PR to develop; do not merge automatically.

## Milestone 4 recommendations

Agree on documented order/payment contracts and stock revalidation first. Define variants, delivery charges and tax policy before adding those calculations. Add browser interaction/accessibility tests, then implement server-side order creation and payment lifecycle with idempotency. Decide on order history and secure confirmation persistence before retaining customer details beyond the current visit.

## Final validation results

- `npm.cmd test`: 26 tests passed, 0 failed (12 cart/checkout and 14 existing regression tests).
- `npm.cmd run lint`: passed with no errors or warnings.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed; Vite transformed 47 modules and emitted the production bundle.
- `git diff --check`: passed; Git emitted only existing Windows line-ending conversion notices.
- Browser event/visual/accessibility QA: not executed; manual checklist above remains pending.
- GitHub PR: summary prepared locally; branch creation was rejected, so no hosted PR exists.
