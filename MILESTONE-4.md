# Milestone 4 — Customer authentication and account management

## Implementation

Added frontend-only demonstration registration, login, password recovery and account/profile management to the existing React/TypeScript/Redux/Vite application. The existing Redux store, cart persistence, guest checkout, catalogue and storefront components remain in use. No dependencies, backend endpoints, payment integrations, administrative modules, tokens or credential database were added.

Reviewed AGENTS.md, dependencies, Redux slices, History API routing, native checkout validation and Node/Vite SSR tests before implementation. Inspected Sign in.png, Account Setup.png, Password Creation.png, Forgot Password.png and New Password Setup.png. Auth screens reuse the centered logo, purple heading/buttons, outlined fields and password guidance. Phone is included because it appears in Account Setup.png. Registration uses one form with the requested full-name/password-confirmation fields. Social login, date of birth, verification codes and live policy acceptance are outside the requested scope. No approved dashboard design exists; account pages reuse storefront components and established layouts.

## Completed features

- Registration: full name, email, phone, password/confirmation, visible rules, inline errors, first-invalid-field focus, independent password visibility controls, loading/duplicate guards and success feedback. Registration creates no stored user and does not automatically log in.
- Login: required/email validation, password control, loading, success/error/retry, recovery and registration links. Any valid email/non-empty password demonstrates success; fail@example.com demonstrates failure. Credentials are not verified.
- Recovery: email validation, generic simulated feedback, direct demo-reset navigation, password validation/confirmation and reset-success page. No email, reset token or real password change occurs.
- Protected account dashboard and profile routes preserve intended destinations through a returnTo query parameter. Return destinations are allowlisted to account routes to avoid external redirects.
- Account overview displays name, email and phone, edit-profile navigation, logout and continue-shopping actions. Profile editing validates fields, saves through the adapter to Redux only, handles simulated failure, preserves the previous profile on failure and provides cancel/success feedback.
- Logout clears demo auth state and invalidates pending auth/profile requests so late responses cannot restore a logged-out customer. Cart state is unaffected.
- Client-side internal navigation retains the in-memory session. Normal same-origin left-click links use History API; modified clicks, external links, downloads and same-page hash links keep native behaviour. Header search also uses History API. Existing catalogue URL filters and Back/Forward remain supported.
- Reusable fields use native labels, autocomplete, linked errors, visible focus and accessible password-control states. Auth and profile layouts adapt to mobile/tablet/desktop widths.

## Redux architecture and credential handling

The single store now registers `auth` alongside `catalogue`, `cart` and `checkout`.

Auth state:

```text
auth: {
  profile: { fullName, email, phone } | null,
  status: 'idle' | 'loading' | 'success' | 'error',
  operation: 'login' | 'register' | 'forgot' | 'reset' | 'profile' | null,
  requestId: string | null,
  error: string | null
}
```

`selectCustomer` and `selectIsAuthenticated` expose typed profile/session state. Mock operations use a replaceable AuthAdapter passed in the existing Redux thunk extra argument alongside checkout services. Auth input validation lives outside presentation components.

Passwords exist only in component-local form state and transient request closures. Credential-bearing operations deliberately use custom thunks rather than createAsyncThunk arguments, which would serialize input into action metadata. Only non-secret request metadata and allowlisted profile fields reach Redux actions/state. Adapter errors become a fixed safe error message; unexpected fields in adapter profile responses are removed before dispatch. Forms clear passwords after completed requests; navigating away discards form state. No auth data, credentials or fake JWTs enter localStorage/sessionStorage. The adapter retains no registration records or credentials.

Session strategy is memory-only: internal navigation retains login; refresh, new tabs, full document navigation or closing the page starts anonymous. Profile edits also end with the visit. Client-side route guards are UI behaviour, not real authorization. Cart persistence remains under the existing localStorage key and survives login/logout and refresh. Login produces a generic Demo Customer profile, not a previously registered identity; registration/reset do not affect later login credentials.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| /register | Public | Demo registration and success feedback |
| /login | Public | Demo login; optional allowlisted returnTo |
| /forgot-password | Public | Simulated recovery request |
| /reset-password | Public | Token-free demo reset form |
| /password-reset-success | Public | Explicit demo reset confirmation |
| /account | Protected UI | Account overview and logout |
| /account/profile | Protected UI | Edit profile |

Protected routes replace the current URL with /login?returnTo=... when anonymous, then replace login with the intended route after success. The login destination persists in the URL across refresh. Direct access to the reset-success page displays demonstration copy and does not claim an actual reset occurred. Guest checkout stays public.

## Files created

- src/features/auth/types.ts — typed profile, inputs, operation state and adapter contract.
- src/features/auth/validation.ts — profile/login/registration/reset validation, password rules and profile sanitization.
- src/features/auth/adapter.ts — stateless delayed mock adapter with documented email failure scenario.
- src/features/auth/slice.ts — state, selectors, guarded async operations and logout cancellation.
- src/features/auth/navigation.ts — allowlisted return destinations and History API navigation.
- src/components/auth/AuthLayout.tsx — centered design-led auth shell and demo disclosure.
- src/components/auth/AuthField.tsx — labelled fields, error associations and controlled password visibility.
- src/components/auth/ProtectedRoute.tsx — account route guard and login fallback.
- src/pages/AuthPage.tsx — login, registration and recovery/reset forms.
- src/pages/PasswordResetSuccessPage.tsx — demo reset-success view.
- src/pages/AccountPage.tsx — account shell, overview, profile form and logout.
- tests/auth.test.mjs — auth/validation/state/service/route/rendering tests.
- MILESTONE-4.md — implementation report and PR preparation.

## Files modified

- src/app/store.ts — auth slice and adapter injection; existing cart subscriber unchanged.
- src/App.tsx — auth/account routes and session-preserving internal navigation.
- src/components/StoreHeader.tsx — Sign in/My account links and client-side search navigation.
- src/App.css — responsive auth/account layouts, password controls and profile styling.
- README.md — milestone documentation link.

No AGENTS.md changes were necessary. Pre-existing uncommitted work from earlier milestones was retained.

## Automated and manual verification

Uses the existing Node test runner with Vite SSR, React static rendering and actual Redux dispatches; no testing library was added. Tests include rendering and labels, validation, controlled password visibility/callback wiring, successful registration/login, failed login/retry, duplicate operations, recovery/reset, auth state, protected rendering/login destinations, safe intended-route restoration, navigation helper behaviour, account/profile rendering/editing, failures, logout and late-response cancellation, credential exclusion from Redux state/actions, cart preservation and guest checkout. Existing homepage/category/product/search/filter/sort/cart/checkout regressions remain included.

Browser-driven form events, route-guard effects, pixel comparison, responsive visuals and keyboard/screen-reader checks require manual review; no browser preview/automation tool is available in this session. SSR rendering alone does not establish those behaviours. Concurrent Vite test servers can emit a non-fatal WebSocket-port warning.

Final command results are recorded below after execution. On this Windows host use npm.cmd because PowerShell blocks npm.ps1.

Manual review:

1. Run npm.cmd run dev. Open /register at 375px, 768px and desktop widths. Compare centered branding and field layouts to the supplied account/password screenshots.
2. Submit empty/invalid registration fields. Try invalid email/phone, short passwords, missing number/symbol, spaces, name/email in password and mismatched confirmation. Verify first-invalid-field focus, inline messages and both Show/Hide controls.
3. Submit valid sample details. Confirm demo-registration feedback, no live-account claim and no auth/password storage. Follow Sign in.
4. Log in with any valid sample email and non-empty sample password. Use fail@example.com for a failed login; retry with another email. Check disabled/loading controls and repeated-click protection.
5. Open /account/profile while signed out. Verify redirect preserves returnTo, then successful login opens the edit page. Refresh login before signing in; destination should remain. Unsafe returnTo values should fall back to /account.
6. Visit account overview. Edit all permitted fields, save and confirm overview updates. Use fail@example.com to simulate a profile-save error; the previous profile should remain. Check cancel discards unsaved edits.
7. Use internal storefront links and header search while signed in; My account should remain available. Refresh: demo session and edited profile end, and protected pages return to login. Check Back/Forward.
8. Add products to cart before login. Log in/out and refresh; cart must remain. Guest checkout must still validate/submit a demo order. Confirm no auth requirement was added to checkout.
9. Try forgot password with invalid then valid email. Confirm no email-sent claim; continue directly to demo reset. Validate/reset sample password; confirm explicit no-real-password-changed feedback and login navigation.
10. Log out during a pending profile save; late responses must not sign the user in. Check account routes cannot display a customer after logout.
11. Keyboard-check skip links, field labels, error focus, visibility buttons, account navigation and logout; inspect at mobile/tablet/desktop for overflow. Modified/external links should keep normal browser behaviour.
12. Regression-check homepage sections, category links, details/gallery, searches, combined filters, sorting, pagination, cart quantity limits/persistence and checkout confirmation.

## Limitations and backend requirements

- Demonstration only: no identity proof, authorization, credential checks, account database, real reset/verification, OAuth or session recovery. Generic login profile and memory-only edits are deliberate.
- No saved-address management, order history or other Milestone 5 modules were implemented.
- Future backend integration needs documented registration/login/logout/current-customer/profile contracts, server-side validation and authorization, secure session cookies, CSRF strategy, rate limits, generic recovery responses and expiring single-use reset/verification flows. Replace the adapter only after contracts and error formats are agreed; do not introduce client-persisted secrets or fake tokens.
- Before production, add browser interaction/accessibility coverage and review privacy, consent and account lifecycle requirements. Keep cart continuity and checkout independent of auth unless product requirements explicitly change.

## GitHub delivery and prepared pull request

Requested branch: feature/customer-auth. Target: develop. The checkout began on feature/homepage with uncommitted Milestone 2/3 work; that work was preserved. Branch creation requires an approved Git metadata write in this environment. Branch request outcome is recorded with the final results. No unrelated changes should be staged, no direct main push or automatic merge should occur, and no branch-protection settings were changed.

Suggested conventional commit: feat(auth): add demo customer authentication and account management

PR title: feat(auth): add demo customer authentication and account management

Overview: Add frontend-only registration, login, password recovery and protected customer account/profile pages. A stateless replaceable mock adapter drives Redux demo state; credentials stay outside Redux actions and browser storage. Internal navigation preserves the memory-only session, logout invalidates pending requests, and cart/guest checkout behaviour remains intact.

Files changed: auth feature/types/adapter/validation/navigation; shared auth layout/fields/guard; auth/account/reset-success pages; App routing, store registration, header links/search, CSS, tests and documentation listed above.

Screenshots: supplied design screenshots reviewed; implementation screenshots were not captured.

Testing evidence: see final validation results below.

Known limitations: demo identity only, memory-only session/profile, no real email/reset/OAuth/backend, browser QA pending. No Milestone 5 features included.

Review checklist:
- [ ] Resolve branch and earlier-milestone baseline before staging only intended files.
- [ ] Review password exclusion from actions/state/storage and adapter response allowlist.
- [ ] Verify anonymous account redirects and safe destination restoration.
- [ ] Complete manual mobile/tablet/desktop, keyboard and browser regression checks.
- [ ] Verify failure/retry, pending-logout cancellation, cart continuity and guest checkout.
- [ ] Run tests, lint, typecheck and production build.
- [ ] Open PR to develop; do not merge automatically.

## Recommended Milestone 5

Agree on customer order-history and saved-address requirements/designs before implementation. Define typed contracts and backend ownership first, then add read-only order history/detail and address management only within the approved milestone. Retain explicit mock labels until actual services exist; avoid payment or administrative scope without approval.

## Final validation results

- npm.cmd test: 45 passed, 0 failed (19 authentication/account tests plus 26 existing regression tests).
- npm.cmd run lint: passed with no errors or warnings.
- npm.cmd run typecheck: passed.
- npm.cmd run build: passed; 57 modules transformed and production assets generated.
- git diff --check: passed; only Windows line-ending notices were emitted.
- Browser/visual/keyboard QA: not executed; complete the manual checklist above before approval.
- Branch creation: the requested elevated write for feature/customer-auth was rejected. Work remains uncommitted on feature/homepage; prior uncommitted milestones remain intact. No commit, push, hosted PR or merge occurred. PR summary and suggested conventional commit are prepared above.
