# feat: add production readiness checks and browser journey coverage

Target `develop` from `feature/milestone-8-production-integration`. **Draft: production commerce release is blocked.**

Direct account-page loads could emit a login redirect before the router subscribed to URL changes. Use a React external-store subscription to catch these redirects, retain the earlier Vercel SPA refresh fix, and declare build/output plus basic response headers.

Add Playwright checks for discovery/filtering, cart persistence/totals, account/address edits, demo checkout, order history, logout, validation/failure handling, refreshes and responsive keyboard behavior at mobile/tablet/desktop widths. Add a Node 24 CI workflow for lint/types/Node tests/build/dependency auditing/browser tests and report artifacts. Keep existing Redux/mocks; no live API contract or payment service is invented.

Milestone 7 was not merged into develop. Its audit is cherry-picked into this branch so reviewers can assess the actual blocked integration status. See MILESTONE-8.md and docs/DEPLOYMENT.md and docs/TESTING.md for evidence, commands, limitations and release gates.

Runtime audit: zero vulnerabilities. Full audit: 12 moderate development-tool findings; no high/critical findings. Large PNGs and manual accessibility/cross-browser/preview checks remain follow-ups. No production deployment is authorized by this PR.

Validation: lint, TypeScript (including browser specs), 72/72 Node tests, production build and 21/21 Chromium tests at 375/768/1440px passed. The initial browser run exposed an ambiguous stock locator, corrected before the final passing run. Hosted CI/preview and real commerce API integration remain unverified.
