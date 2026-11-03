# Validation and customer journey testing

Use Node 24 and install the exact lockfile with `npm ci`. On PowerShell, substitute `npm.cmd`/`npx.cmd` if execution policy blocks npm.ps1.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e -- --workers=2
npm audit --audit-level=high
npm audit --omit=dev
```

Node tests use the existing test runner, Vite SSR and React server rendering. The browser suite uses Playwright Chromium against the **built application** on a locally managed preview at `127.0.0.1:4173`. Run the build first. The preview server is test infrastructure; it is not a backend dependency of a deployed build. Test configuration, specs and application source all participate in TypeScript validation.

Seven browser scenarios run at 1440×900, 768×1024 and 375×812:

1. Direct protected URL, refresh, login and intended-destination restoration.
2. Homepage/categories, search, sorting, maximum-price filtering, product images/details and unavailable stock.
3. Cart quantity/total changes, persisted refresh and removal/empty state.
4. Profile edit, saved default address, checkout prefill, demo order confirmation, single history entry, order details and logout protection.
5. Invalid checkout focus, simulated order-storage failure and cart preservation.
6. Direct URL refreshes, horizontal overflow checks, keyboard skip link and viewport screenshots.
7. Failed mock login, retry, local preferences and disabled password changes.

These are **local demo journeys**, not backend contract tests. The suite's storage fault injection simulates a browser persistence failure, not an API outage. Node tests additionally cover duplicate submissions, stale responses/customer switching, malformed storage, cancellation and mock adapter errors. Network timeouts, expired real sessions, server-side validation, CORS and real order creation remain untested until verified services exist. No invented HTTP endpoints or mock API contracts are used.

Reports: `playwright-report/`; failure traces/screenshots and successful catalogue viewport screenshots: `test-results/`. These folders are ignored. `npx playwright show-report` opens a local report. Screenshots and traces can contain entered details, so use fictional data and restrict shared artifact access. CI retains reports for seven days.

`.github/workflows/ci.yml` validates PRs targeting `develop`/`main` and pushes to those branches with Node 24. It runs lint, types, Node tests, build, high/critical dependency auditing and all three Chromium viewport projects. It has read-only repository permissions, a 20-minute limit, cancellation of superseded runs, and report artifacts. Moderate audit findings remain visible but do not fail the chosen high/critical gate. No existing branch protection was changed; maintainers should require the `validate` job after reviewing the workflow.

Local checks do not prove a hosted GitHub Actions run passed. Preview routing also needs the deployed smoke checks in DEPLOYMENT.md. Manual screen-reader, contrast, touch, Firefox/Safari and real-device checks remain required for a production accessibility review; automated focus/overflow assertions are not an accessibility certification.
