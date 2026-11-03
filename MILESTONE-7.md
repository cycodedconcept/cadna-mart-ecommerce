# Milestone 7: API discovery and integration audit

Status: **Blocked on verified commerce API contracts; integration is not complete.** Audit performed on 3 November 2026. No live endpoint has been integrated, and no API request examples can be supplied without a verified commerce contract.

## Repository and integration base

- Repository: https://github.com/cycodedconcept/cadna-mart-ecommerce
- Target: `develop`; feature branch: `feature/milestone-7-api-integration`.
- Fetched `origin` and created the feature branch from `origin/develop` at `83554af`. Confirmed Milestone 6 commit `ccf1f4c` is an ancestor. PR #8 merged customer account management into that base.
- Preserved the pre-existing README Vercel instructions and untracked `vercel.json` refresh fix. They are separate from this API audit.
- The explicit Milestone 7 instruction supersedes AGENTS.md's original homepage-only/no-backend scope. No change to AGENTS.md is required for this audit.

Reviewed AGENTS.md, README, HOMEPAGE.md, Milestones 2–6, package scripts, Vite/TypeScript/ESLint configuration, Redux wiring, feature adapters, persistence and tests. React 19, TypeScript, Vite and Redux Toolkit are retained. There is no configured RTK Query API service; existing asynchronous behavior uses thunks and injected adapters. No HTTP client, API environment configuration, OpenAPI specification or Postman collection was found in the frontend source tree. `src/services` contains only a placeholder.

Milestones 1–6 cover homepage, catalogue/categories, cart/demo checkout, demo authentication, order history, and profile/addresses/preferences. Existing components and behavior are unchanged.

## Discovery evidence and limitations

1. Searched the frontend checkout and updated `origin/develop` tree for backend references, HTTP calls, environment configuration and contracts. No commerce API contract or base URL was found.
2. General web discovery did not identify an authoritative CADNA MART contract; web access to the repository was unsuccessful. This does not prove that a private backend does not exist.
3. Read-only GitHub public repository discovery found `cycodedconcept/CADNA_BACKEND`. Inspected its source at `c3f840802f5d3de13c145981be7c716acdefc27b`. Its [README](https://github.com/cycodedconcept/CADNA_BACKEND/blob/c3f840802f5d3de13c145981be7c716acdefc27b/README.md) describes an assessment/exam platform. Its user model defines student/instructor/admin roles, and `index.js` mounts exams, exam sessions, results and study resources. It is an unconfirmed, different-domain candidate, not an approved commerce dependency. Its authentication routes must not be assumed to belong to this store.
4. Postman CLI 1.75.0 is installed. `postman status` is unsupported by this version; `postman whoami` confirms no signed-in account. Private workspace search and Context Graph discovery were therefore skipped. No Postman resources were imported or changed.
5. GitHub CLI is absent. The GitHub plugin was suggested for authenticated discovery/PR creation; connection has not been confirmed.

The downloaded candidate is in ignored `.api-audit.local/`; it is not application source, a runtime dependency, or an artifact to stage. No backend dependencies were installed and no candidate service was started.

## API integration matrix

`Unverified` means no authoritative commerce contract has been supplied or discovered; it does not claim that an endpoint does not exist. Paths and methods are deliberately unspecified rather than guessed.

| Feature | Endpoint | Method | Integration status | Current fallback | Blockers / contract needed |
| --- | --- | --- | --- | --- | --- |
| Login and registration | Unverified | Unverified | Blocked | `mockAuthAdapter`, demo identity | Commerce owner, request/response schema, user ID, validation, authentication mechanism |
| Logout and session restoration | Unverified | Unverified | Blocked | Redux logout; refresh starts anonymous | Session endpoint, cookie/token lifecycle, expiry, revocation, CSRF and CORS requirements |
| Password recovery/reset/change | Unverified | Unverified | Blocked | Demo recovery/reset; password change disabled | Token delivery, reset/verification payloads, expiry and error contract |
| Product listing and details | Unverified | Unverified | Blocked | Typed local catalogue and detail pages | Product/variant IDs, currency, price units, image URLs, stock and detail schema |
| Categories | Unverified | Unverified | Blocked | Typed local category data | Category IDs, schema and product associations |
| Search, filters, sort, pagination | Unverified | Unverified | Blocked | Client-side query functions | Supported query parameters, sort values, metadata and limits |
| Cart read/add/update/remove | Unverified | Unverified | Blocked | Redux cart and validated localStorage | Guest/customer cart ownership, item/variant IDs, quantities, authoritative totals and conflicts |
| Checkout and order creation | Unverified | Unverified | Blocked | Explicit local demo checkout | Payload, delivery policy, server price/stock validation, idempotency and order response |
| Order history and details | Unverified | Unverified | Blocked | Customer-scoped local order repository | Customer authorization, IDs, money/status mapping, list/detail responses |
| Profile read/update | Unverified | Unverified | Blocked | Mock auth adapter and local account persistence | Allowed fields, stable customer ID, verified email behavior, validation errors |
| Address list/create/edit/delete/default | Unverified | Unverified | Blocked | Account slice and validated local persistence | Address schema, ownership, IDs, default-selection rules and concurrency |
| Notification preferences | Unverified | Unverified | Blocked | Local demo preferences, no delivery | Supported preferences and update contract |

## Implementation plan once contracts are available

1. Confirm the commerce repository/spec version and environment base URL with the backend owner. Review methods, payloads, responses, error shapes, authentication, CORS and any missing endpoints before wiring calls.
2. Keep the store and thunk/adapter conventions. Add a small centralized request layer only for verified integrations: cancellation, response validation, safe error mapping, and documented unauthorized handling. Do not introduce RTK Query just because Redux Toolkit makes it available.
3. Proposed configuration name: `VITE_API_BASE_URL`. This variable is **not implemented or consumed yet**; no environment variable is currently needed to run the demo. Add `.env.example` only when a verified URL/configuration is available. Vite-prefixed variables are public client configuration and must never contain credentials or secrets.
4. Integrate supported authentication and session restoration first. Use the backend's actual cookie/token mechanism. Never persist passwords or invent a refresh flow. Invalidate pending customer requests and clear customer-owned state on logout/401.
5. Integrate catalogue/categories, then cart/checkout, then orders/account/addresses. Map real IDs and money units explicitly. The current cart imports static products and order restore accepts numeric product IDs/local image paths; these assumptions must be updated together with verified response mapping to avoid mixing live and mock data.
6. Preserve demo checkout wherever live checkout is unavailable. Do not silently fall back from a failed live mutation to a simulated success. Separate demo identities/data from real account data before enabling live authentication.
7. Use Node/Vite tests with verified fixtures for success, invalid responses, validation, empty results, network errors, unauthorized/expired sessions, cancellation and customer switching. Exercise dependencies through contract-backed mocks/simulation when direct service testing is unavailable. Verify the whole customer journey, then lint/typecheck/test/build and browser QA.

## Validation and observations

Run on the updated integration branch, before documentation-only changes:

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Passed |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd test` | Passed: 72/72; zero failures, skips or cancellations |
| `npm.cmd run build` | Passed: 73 modules; JS 322.18 kB (98.75 kB gzip), CSS 21.69 kB (5.32 kB gzip) |
| Live commerce API / end-to-end integration | Not run: no verified commerce service/contracts |
| Browser interaction / accessibility walkthrough | Not run: no connected browser test infrastructure |

Existing concurrent SSR tests emitted HMR port-in-use warnings; test exit status was successful. These tests establish the demo baseline, not live API compatibility. No runtime dependency, bundle behavior, API traffic, payment behavior or credential handling changed. Existing demo customer scoping is not server authorization. Prices and inventory remain illustrative client data, not authoritative backend values. No secrets were added.

## Delivery and blockers

Successfully integrated features: **none**. Files added for Milestone 7: `MILESTONE-7.md` and `MILESTONE-7-PR.md`. README adds the audit link. Only the audit section of README belongs to this milestone; the unrelated uncommitted refresh instructions are preserved separately.

Required to resume: commerce backend repository or authoritative OpenAPI/Postman documentation; intended base URL/environment; confirmed authentication/session contract; safe test account/setup where required. Supply configuration without pasting production credentials into chat or committing them.

The requested feature branch is created. A review draft may document discovery, but it must not claim completed integration. No direct push to main/develop, force-push, merge or branch-protection change is authorized. Commit/push/PR outcomes are recorded in the final handoff; a prepared PR description alone is not a hosted PR.
