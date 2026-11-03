# Milestone 8: Production readiness and handover

Decision: **NO-GO for production commerce.** Readiness improvements are implemented for the existing demo; live API integration, hosted preview validation, review and release authorization remain outstanding. Do not describe this milestone as fully complete or the mock flows as production services.

## Audit and branch provenance

Audited on 3 November 2026: AGENTS.md, README, Milestones 1–7, source structure, Redux/adapters/persistence, routing/auth guards, tests, package/TypeScript/Vite/ESLint configuration, Git branches and Vercel configuration. The explicit Milestone 8 request authorizes this work beyond AGENTS.md's original homepage scope; AGENTS.md is otherwise preserved.

The stack remains React 19, TypeScript, Redux Toolkit and Vite 8 with a custom History API router. There is one Redux store with catalogue, cart, checkout, auth, orders and account slices. Thunks/adapters provide mock asynchronous behavior; cart/account/orders use validated browser persistence. Auth is memory-only; client customer scoping is not authorization. No backend, payment or admin feature was added.

Fetched origin. `origin/develop` remains `83554af`, includes Milestone 6, and **does not include** Milestone 7 audit commit `24a8245`. Created `feature/milestone-8-production-integration` from that develop base and cherry-picked the audit as `f32705d` so this review branch includes it. This does not merge Milestone 7 into develop. Milestone 7 contained discovery documentation, not implemented API integrations. The previous uncommitted Vercel refresh fix was preserved and completed as part of this readiness work.

No GitHub Actions workflow or browser suite existed. Vercel configuration had only the uncommitted SPA fallback. The known deployment URL is user-supplied; dashboard connection/settings/logs are unverified. The web tool could not access its homepage or catalogue; that result is not evidence of an outage.

## API verification matrix

The detailed discovery evidence remains in [MILESTONE-7.md](MILESTONE-7.md). No new authoritative commerce contract or base URL was supplied. `CADNA_BACKEND` was previously inspected and identifies an assessment/exam service; it cannot be assumed to serve this store.

| Feature | Endpoint / method | Verification | Current behavior / blocker |
| --- | --- | --- | --- |
| Login/register/logout/session | Unverified | Not integrated | Demo adapter and Redux logout; real identity/session/401/expiry contract needed |
| Password recovery/reset/change | Unverified | Not integrated | Demo recovery/reset; change disabled; verified secure backend flow needed |
| Products/details/categories | Unverified | Not integrated | Local typed data; stable IDs/schema/currency/stock mapping needed |
| Search/filter/sort/pagination | Unverified | Client-side only | Local query functions; backend parameters/results contract needed |
| Cart CRUD | Unverified | Browser-local only | Redux/localStorage; ownership/inventory/totals contract needed |
| Checkout/order creation | Unverified | Explicit demo only | Local simulated submission; no live order/payment; server validation/idempotency needed |
| Order history/details | Unverified | Browser-local only | Local repository; server authorization and status/money schema needed |
| Profile/preferences | Unverified | Mock/local only | Verified allowed-field/update/error contract needed |
| Address CRUD/default | Unverified | Browser-local only | Verified IDs/ownership/default and concurrency contract needed |

Loading, validation, demo errors and stale-customer safeguards have existing Node coverage and browser journey coverage where applicable. Real network interruptions/timeouts, session expiry, server mutation responses and backend authorization cannot be validated against an absent commerce service. No sample API requests or environment values were invented.

## Implemented changes

- Router reads the current URL with `useSyncExternalStore`, which rechecks after subscribing. This prevents missing a protected-page login redirect emitted by a child mount effect before the parent's old passive event subscription. Existing link interception, Redux and URL conventions remain intact.
- Vercel: framework `vite`, build `npm run build`, output `dist`, SPA fallback to `/index.html`, nosniff/referrer/frame headers. These settings require deployment before they affect hosted behavior.
- Playwright development dependency, seven browser scenarios across desktop/tablet/mobile, production preview testing, failure traces and viewport screenshots. No runtime dependencies added.
- CI: Node 24 lockfile install, lint, typecheck, Node tests, build, dependency audit and browser checks; read-only permissions/report artifacts. No automated production deployment or protection changes.
- TypeScript includes browser specs/config. `.env` files and browser artifacts are ignored. Product image decoding is asynchronous while existing lazy loading is retained.
- Deployment/environment/troubleshooting and testing guides plus this handover and a prepared draft PR description. No API environment variable is consumed; future `VITE_API_BASE_URL` remains only a proposal.

## Security review

Runtime dependency audit (`npm audit --omit=dev --json`): **0 vulnerabilities**. Full audit: **12 moderate, 0 high, 0 critical**, caused by the development-tool minimatch chain. [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) covers pattern amplification and identifies 11.0.1 as patched. npm suggests incompatible toolchain changes; no forced downgrade or unverified major transitive override was applied. Review compatible upstream remediation and rerun lint/types/tests before accepting dependency changes. CI fails at high severity and reports moderate findings.

Source inspection found no `dangerouslySetInnerHTML`, direct innerHTML writes, console logging of credentials, hardcoded API URLs or localhost service calls in application TS/TSX. Tracked file-name checks found no .env/key/pem files; this is not a comprehensive historical secret scan. No secret was introduced. Credentials remain out of persisted app state; browser account data remains unencrypted fictional demo data. Production requires server authorization, secure identity/session handling, data protection and server validation; route guards/client form validation do not provide those controls. Backend CORS/CSRF cannot be verified here.

## Performance and accessibility

Before readiness changes: JS 322.18 kB / 98.75 kB gzip; CSS 21.69 kB / 5.32 kB gzip. Current build: JS approximately 322.20 kB / 98.75 kB gzip; CSS unchanged. The routing fix adds no meaningful download cost. Existing cards already lazy-load images; asynchronous decoding avoids synchronous decoding where supported. There is no claimed Lighthouse score or loading-speed improvement.

Largest source PNGs: flash-sale 2,959,258 bytes; hero 2,288,491 bytes; newsletter 969,240 bytes. Responsive WebP/AVIF source artwork and visual comparison are the priority for slow-network performance. Route splitting is deferred: the shared mock catalogue/store dependencies and server-rendered test assumptions need a measured, reviewed change rather than an unverified loading-boundary rewrite. Redux selectors and customer cancellation guards remain intact; no profiler-measured rerender optimization is claimed.

Browser checks cover keyboard skip links, first-invalid-field focus, labels used by accessible locators, protected-page interaction and horizontal overflow at 375/768/1440px. This does not replace screen-reader, contrast, cross-browser or real-device review.

## Validation record

The existing 72 Node tests passed after the router change; lint/typecheck and production build passed. Initial browser run completed 18 passing checks and three failures caused by a locator matching both an out-of-stock paragraph and button; corrected to assert the disabled stock button. Its sandbox cleanup stalled and was interrupted. The full corrected Chromium run completed successfully outside the sandbox: **21/21 passed in 1.2 minutes**, zero retries/skips. Reviewed mobile and desktop catalogue screenshots; layout and controls fit their viewports. Full-page capture can omit offscreen lazy images before scrolling, so it is not evidence of failed image delivery. Hosted CI and live preview/API validation have not been claimed.

| Command | Actual result |
| --- | --- |
| `npm.cmd run lint` | Passed |
| `npm.cmd run typecheck` | Passed, including browser specs/config |
| `npm.cmd test` | 72/72 passed |
| `npm.cmd run build` | Passed, 73 modules |
| `npm.cmd run test:e2e -- --workers=2` | 21/21 passed across three viewports |
| `npm.cmd audit --json` | Exit 1: 12 moderate development-tool findings |
| `npm.cmd audit --omit=dev --json` | Exit 0: zero runtime findings |
| `git diff --check` | Passed |

## Handover and release gates

- [x] Preserve Milestones 1–6 and carry Milestone 7 audit into review branch.
- [x] Add browser tests, CI, router fix, deployment configuration and guides.
- [x] Run runtime/full dependency audits and document remaining moderate findings.
- [ ] Supply and verify commerce API contracts, test environment and authentication mechanism; implement integrations under review.
- [ ] Complete real network/error/expired-session/server-authorization and checkout validation.
- [ ] Inspect the generated Vercel preview, logs, response headers and direct refreshes using [DEPLOYMENT.md](docs/DEPLOYMENT.md).
- [ ] Review viewport screenshots and complete manual accessibility/cross-browser checks; optimize large raster assets.
- [ ] Review compatible minimatch/tooling remediation and historical secret scanning.
- [ ] Obtain hosted CI results, PR review and integration approval; then prepare the separately authorized develop-to-main release PR.

Maintenance: use Node 24 and `npm ci`, keep contracts versioned, review audits regularly, keep fiction-only demo data, use CI artifact access controls, and rerun journey tests after changes to persistence/routing/identity. Test commands and scope are in [TESTING.md](docs/TESTING.md). Deployment/environment/rollback steps are in [DEPLOYMENT.md](docs/DEPLOYMENT.md). No production release, merge, force-push or release PR is performed before the required approval.
