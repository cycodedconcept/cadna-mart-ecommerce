# Milestone 5 — Customer order history and account dashboard

## Implementation overview

Extended the existing checkout snapshot, single Redux store, mock authentication and account layout with versioned local demo order storage, customer-scoped history/details, status displays and dashboard summaries. No new dependencies, backend calls, payment integrations, administration, shipment tracking or customer-controlled status changes were added.

Before modifying files, reviewed AGENTS.md, package dependencies, folder structure, Redux slices, cart/checkout snapshots and price conventions, mock authentication/profile identity, routing/guards, account components and Node/Vite SSR tests. The supplied design folder contains no order-history/dashboard designs, so new views follow existing account/storefront styling. The implementation plan was presented before changes. Existing uncommitted work from earlier milestones was preserved; AGENTS.md did not need changes.

## Features completed

- Signed-in successful demo checkout saves an order with a stable customer association, unique reference, creation date, product/image/price snapshots, integer-kobo line totals/subtotal/final total and Pending status.
- Storage save completes before cart clearing and checkout success. A failed repository save rejects checkout, retains the cart and exposes retry feedback. Existing synchronous form lock and Redux pending guard prevent repeated pending submissions; repository writes are idempotent for identical references and reject conflicting duplicates.
- Guest checkout stays public. Guest records have customerId null and are never automatically claimed by later sign-in or returned in account history.
- Protected order history supports reference/product-name search, status filtering, newest/oldest and both total sorts, clear filters, item counts, date/status/total/details links, empty/no-results/loading/error/retry states.
- Protected details show purchase-time images/names/quantities/prices/line totals, subtotal/final total, creation date, status and explicitly fictional delivery information. Missing or other-customer orders receive identical not-found feedback.
- All five display-only statuses are supported: Pending, Processing, Shipped, Delivered and Cancelled. New checkout orders are Pending. No status timers, tracking or status-edit controls exist.
- Account overview retains profile summary/edit/logout navigation and adds total/pending/delivered counts, three most recent orders and View all orders. Shared account layout is extracted and reused across account/profile/history/details.
- Logout and identity switching clear account order state, invalidate pending loads and suppress stale history responses. Account-owned checkout confirmations cannot be viewed by a different active customer; logout also clears the existing confirmation snapshot.
- Cart and guest checkout remain independent of authentication. Existing registration, login, recovery and profile-management behaviour is preserved.

## Order model

```text
OrderRecord {
  id, reference, customerId: string | null, createdAt: ISO string,
  items: [{ productId, name, image, quantity, unitPrice, total }],
  subtotal, total, status,
  delivery: { address, city, state }
}
```

The persisted model reuses the existing DemoOrder item type rather than inventing another product model. All amounts are integer kobo; the existing formatter renders naira. Historical views never look up current catalogue names/prices. There are no delivery charges, taxes or discounts in the existing mock policy, so subtotal equals total. Payment transactions/status are not invented: the interface states that no payment was collected and no delivery is arranged.

The ephemeral checkout confirmation continues displaying the customer fields for that visit; persisted history replaces delivery with the fixed fictional location `12 Demo Market Road, Demo City, Demo State`. It omits name/email/phone/instructions and other entered address fields. This deliberate privacy choice is disclosed before checkout and on saved-order details. Use sample information only.

## Customer identity and isolation

Auth state now includes customerId, derived at successful demo login as `demo-` plus SHA-256 of the normalized login email. The same fictional email retrieves the same history after refresh and re-login. The email itself is not written to order storage. Profile edits retain the original login identifier during the visit; after refresh, use the original login email to retrieve those orders. Logging in with the edited email creates a different demo identity. A future backend must supply immutable customer identifiers.

The derived ID is pseudonymous, not anonymous or secret. Knowing another demo login email lets a person imitate that demo customer because there is no real authentication. Repository filtering, Redux selectors, guards and not-found UI only provide frontend data separation, not security or authorization. Never use real customer information or production orders in this repository.

## Redux architecture

The existing store now combines catalogue, cart, checkout, auth and orders. The order repository joins existing checkout/auth services in the thunk extra argument.

```text
orders: {
  items: OrderRecord[], customerId: string | null,
  status: 'idle' | 'loading' | 'ready' | 'error',
  error?, warning?, requestId?
}
```

- loadOrders reads through the repository for the current auth ID, exposes loading/error/retry and checks request/owner identity before accepting results.
- orderStored adds successful checkouts only to the matching active customer state. Guest and other-customer records are ignored.
- selectCustomerOrders, selectOrderById, selectFilteredOrders and selectOrderSummary derive owner-isolated data, search/filter/sort and dashboard figures. Dashboard components do not duplicate order state.
- Pending reads merge orders completed during a read so a delayed repository response cannot remove a just-created order. Logout/account changes reset pending request identity.
- Authentication remains memory-only. Refresh signs out; sign in again with the same fictional login email to retrieve persistent orders. Cart persistence is unchanged.

## Mock repository and persistence

`OrderRepository` exposes asynchronous list(customerId) and save(order), allowing future service replacement without changing components. Local storage key: cadna-orders-v1. Format: `{ version: 1, orders: [...] }`.

Read validation checks the envelope/version, ID/reference/customer ID, parseable creation date, status, item identifiers/names/local image paths, safe integer quantity/prices and internally consistent totals. Unexpected fields are dropped, delivery is replaced with fictional values, and invalid/duplicate records are ignored with a warning. Unparseable JSON produces an empty recovered list with a warning; the next successful save replaces unreadable data. Unsupported versions/envelopes produce a handled error and are not overwritten automatically. Blocked/quota-limited storage produces retryable history/checkout errors rather than false order success.

To manually recover an unsupported envelope, remove only the cadna-orders-v1 key in browser developer tools after reviewing any useful demo data, then retry. Do not clear unrelated browser storage. Storage is a local demonstration repository, not a secure database. Cross-tab transaction/merge safety, retention policies and migrations from future versions are not implemented. Synchronous read/write prevents interleaving within one tab, not between tabs.

## Checkout integration

1. Validate the existing checkout form and snapshot the cart/customer ID.
2. Generate the existing UUID-based DEMO reference and snapshot purchased products/prices.
3. Await the existing simulated submit service.
4. Build a Pending order record with fictional persisted delivery data and save through the repository.
5. Dispatch orderStored, clear the cart, and fulfill checkout with saved order ID/owner metadata.
6. Navigate through the existing confirmation route. Signed-in owners receive a View saved order link; guest confirmations do not link into account history.

If storage fails, no success navigation/cart clearing occurs. Simulated submission does not call a backend or process a payment. A customer switch during a pending checkout retains the original owner association and hides that confirmation from the new account.

## Routes

| Route | Purpose |
| --- | --- |
| /account | Existing account overview plus order statistics and recent orders |
| /account/orders | Protected history/search/filter/sort |
| /account/orders/:orderId | Protected saved-order details |
| /order-confirmation | Existing transient checkout confirmation with owner-only saved-order link |

The existing History API navigation and reusable ProtectedRoute are retained. Allowlisted login return destinations include valid order history/detail routes. Invalid or unavailable IDs never reveal another customer's order contents. Hosting still needs SPA fallback to index.html.

## Files created

- src/features/auth/identity.ts — stable pseudonymous demo login ID.
- src/features/orders/types.ts — persisted model, repository contract, status labels, snapshot creation and date formatting.
- src/features/orders/repository.ts — versioned, validating, allowlisting storage adapter.
- src/features/orders/slice.ts — scoped state, async loading, checkout insertion and derived selectors.
- src/components/account/AccountLayout.tsx — extracted account shell, navigation and order loading.
- src/components/orders/OrderStatusBadge.tsx — reusable accessible display-only status.
- src/components/orders/OrderList.tsx — responsive history/recent-order cards.
- src/components/orders/OrdersFeedback.tsx — loading/error/retry/recovery feedback.
- src/components/orders/OrderDashboard.tsx — derived counts/recent orders.
- src/pages/OrdersPage.tsx — history controls and result states.
- src/pages/OrderDetailsPage.tsx — saved snapshot view and unavailable-order handling.
- tests/orders.test.mjs — 18 repository, selector, checkout, isolation and rendering tests.
- MILESTONE-5.md — completion report and prepared PR description.

## Files modified

- src/app/store.ts — register orders slice; use repository through existing checkout services.
- src/features/auth/types.ts and slice.ts — customer ID state/selector/login derivation while preserving credential exclusions and profile shape.
- src/features/auth/navigation.ts — protected order paths and safe intended-route restoration.
- src/features/checkout/slice.ts — await repository before cart clear, saved-order metadata and logout confirmation cleanup.
- src/App.tsx — history/details routing through existing guard.
- src/pages/AccountPage.tsx — reuse extracted account shell and add dashboard component.
- src/pages/CheckoutPage.tsx — disclose local snapshot storage and fictional delivery policy.
- src/pages/ConfirmationPage.tsx — owner check and View saved order link.
- src/App.css — responsive order cards, controls, statistics, status badges and details styles.
- tests/cart-checkout.test.mjs — inject deterministic repository and give the storage test separate cart/order keys.
- tests/auth.test.mjs — inject repository at existing checkout service boundary.
- README.md — milestone documentation link.

## Actual automated results

- npm.cmd test: **63 passed, 0 failed** — 18 order tests plus all 45 existing tests.
- npm.cmd run lint: passed, no errors/warnings.
- npm.cmd run typecheck: passed.
- npm.cmd run build: passed; Vite transformed 68 modules and emitted the production bundle.
- git diff --check: passed; only Windows line-ending notices were emitted.

Tests exercise Redux/services/repositories and React static rendering using the existing Node runner and Vite SSR. New coverage includes checkout-to-history creation, unique references, duplicate pending submissions/idempotent storage, refresh/re-login retrieval, owner filtering/not-found details, searches/statuses/sorts, immutable historical prices and integer totals, empty history, malformed storage, save failures/cart preservation, successful cart clearing, dashboard summaries, logout/switching and late-response isolation. Existing homepage, categories/details, search/filter/sort, cart/checkout and auth/profile tests remain passing. Concurrent SSR servers may emit a non-fatal WebSocket port warning.

Browser events, guard effects, responsive visuals, keyboard/screen-reader behaviour and pixel fidelity were not tested with a browser: this session has no browser preview/automation tool. The following manual checklist remains required before approval; static rendering does not establish those checks.

## Manual testing

1. Run npm.cmd run dev. Sign in using a fictional email, add products and complete checkout with sample fields. Confirm one Pending reference, cleared cart and View saved order action.
2. Open order history and details. Verify reference/date/item counts, product snapshots, purchase prices/totals and fictional delivery disclosure. Confirm no paid/shipping-complete claims.
3. Refresh, sign in again with the same fictional email, and confirm the order remains. Check intended history/detail navigation after login.
4. Place multiple demo orders, search by partial reference and product name, combine status filtering, try every sort, clear filters and verify no-results feedback. New orders remain Pending; other status styles can be reviewed with fictional test fixtures in developer tooling, not customer status controls.
5. Sign out and sign in with a different fictional email. Confirm counts/history are empty for that account and opening the previous order URL shows Order not found. Switch back to retrieve the original history.
6. Complete checkout while signed out, then sign in. The guest record must not appear in account history or be automatically claimed. Guest confirmation still works during the visit.
7. Edit the profile. Verify order ownership remains tied to the original login email during the visit. Confirm profile cancel/failure behaviour and cart continuity across login/logout.
8. Block browser localStorage or simulate quota failure. Checkout must preserve the cart and show an error; history must offer retry. Restore storage and retry.
9. With fictional data only, test corrupt JSON/invalid records under cadna-orders-v1: reads should recover with warnings. An unsupported version should show an error and remain untouched until that key is manually reset.
10. Try repeated submit clicks and logout/account switching while a checkout/history load is pending. Verify only one order per pending submit and no other-account confirmation/history display.
11. Keyboard-check skip link, account navigation/logout, search/status/sort/clear controls, order links and focus indicators. Check 375px, 768px and desktop for overflow and readable cards/product summaries.
12. Regression-check homepage sections, categories, product details/gallery, header search, filters, sorting, pagination, quantity limits, cart refresh persistence, checkout validation/confirmation, registration/login/recovery and profile editing.

## Known limitations and backend requirements

- LocalStorage and email-derived IDs provide demonstration separation only. Data can be read/modified by browser users; no real authentication/authorization exists.
- Fictional delivery replaces checkout-entered delivery in saved history; no customer PII is persisted by the order repository. Original contact/delivery information is only in the ephemeral checkout snapshot.
- No automatic status advancement, seeded fake deliveries, customer cancellation, tracking, real payments, taxes, shipping charges or guest-to-account linking.
- No cross-tab concurrency protection, server pagination or cloud/device synchronization. Demo records remain in this browser until removed. Query controls reset on navigation.
- Profile email changes are not identity migrations. Future services must supply immutable customer IDs and authenticated ownership checks.
- Backend contracts should cover authenticated order creation/list/detail, server-side stock/pricing/totals, idempotency keys, ownership enforcement, defined delivery/tax/payment policies, status lifecycle, validation/error shapes, timestamps, pagination and privacy/retention. Replace OrderRepository with documented APIs when approved; never assume client filtering is authorization.

## Recommended Milestone 6

Agree on the next customer feature and designs before implementation. Saved-address management is a reasonable next frontend milestone if approved; define its data/privacy/session contracts first. Alternatively prioritize browser interaction/accessibility automation and integration contracts before adding scope. Payments, backend authentication and administration remain separate approval items.

## GitHub delivery and prepared PR

Development branch: **feature/order-history** (created successfully after the Git metadata write was approved). Target: **develop**. Earlier milestones were already uncommitted in this checkout and remain preserved. No commit/push/hosted PR/merge was performed; establish the earlier-milestone baseline before staging an isolated delivery. Do not accidentally commit unrelated prior work, secrets or environment files. No branch protection settings were changed.

Suggested conventional commit / PR title:

feat(orders): add persisted demo order history and account summaries

Overview: Persist successful mock checkout snapshots through a versioned validating repository, then expose customer-scoped order history/details and account statistics/recent orders. Reuse the existing Redux/auth/cart/checkout architecture, preserve guest checkout and clear the cart only after saved-order creation succeeds.

Features: safe local demo storage; stable login-derived customer IDs; history search/filter/sort; historical product pricing; Pending/Processing/Shipped/Delivered/Cancelled badges; details and unavailable-order handling; dashboard counts/recent orders; logout/account-switch isolation and failure/retry feedback.

Files changed: orders model/repository/slice, auth identity/state, checkout integration, account shell/dashboard, history/details components/routes/styles, regression fixtures and documentation as listed above.

Testing evidence: 63 passing tests, lint, strict TypeScript and production build; manual browser QA pending.

Screenshots: no implementation screenshots captured; existing design system reused because no approved order-history screenshots were supplied.

Known issues: frontend-only isolation, browser-local persistence, fictional delivery, memory-only auth, no cross-tab transactional writes, and pending browser QA.

Reviewer checklist:
- [ ] Establish the earlier-milestone Git baseline and stage only intended work.
- [ ] Review persisted-field allowlist and fictional-data disclosures.
- [ ] Verify owner-scoped selectors, detail not-found behaviour and logout/load races.
- [ ] Verify save-before-cart-clear, idempotency and storage-failure recovery.
- [ ] Complete responsive/keyboard/browser regression checklist.
- [ ] Re-run tests, lint, typecheck and build.
- [ ] Open PR from feature/order-history to develop; do not merge automatically.
