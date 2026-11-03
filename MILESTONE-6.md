# Milestone 6: Customer account

## Audit and implementation

Work is on `feature/customer-account`. The repository uses React 19, TypeScript, Vite, Redux Toolkit and a History API router. Existing authentication provides profile validation, public profile fields, protected routes, request cancellation and a stable ID derived from the original demo login email. AccountLayout, AuthField and PasswordField are reused. Checkout remains available to guests; order history remains customer-scoped and stores fictional delivery snapshots. Tests use Node's test runner, Vite SSR and React server rendering. No new runtime or testing dependencies were added.

The older homepage-only AGENTS.md scope is superseded by the explicit Milestone 6 request. AGENTS.md is unchanged because this milestone adds no enduring development convention.

## Behavior and architecture

- `/account` retains the overview and order dashboard.
- `/account/profile` retains validated full name, email and phone editing, save feedback, cancellation and adapter failure handling. Successful edits now persist locally.
- `/account/addresses` adds validated add/edit forms, responsive address cards, native deletion confirmation, empty state and default selection. The first address becomes the default. Deleting the default promotes the first remaining address; deleting the last clears the default.
- `/account/settings` adds order-update and promotion preferences with save/cancel. These are local demo choices and send no messages.
- The password preview uses existing validation and accessible visibility toggles. The change action is disabled with an explicit backend-unavailable explanation. Password values exist only in component memory, never in Redux, storage or network requests.
- Checkout prefills current profile details and the default saved address, allows choosing another saved address or entering a new one, and links to address management. Profile or session changes remount the checkout form so another customer's details cannot linger. Checkout edits do not silently overwrite saved addresses. Orders retain their existing immutable snapshots and persistence behavior.

The new `features/account` slice owns addresses, a single default ID and preferences. The existing auth slice remains the source of customer identity and profile data. Store subscriptions restore account data after demo login and persist whitelisted public fields following edits. Logout clears account data in memory while retaining local records for later demo login.

Storage uses `cadna-account-v1:<customerId>` with a versioned schema. Restore validates fields, drops invalid addresses, repairs invalid default references and ignores malformed JSON. Storage failures show an account warning and retain changes for the current visit. No credentials, tokens or authentication session are persisted. Account data is unencrypted browser mock data, so all account pages explicitly request fictional details. Client-side customer scoping is not authorization.

The customer ID stays unchanged after profile email edits. To retrieve the same mock data following refresh, sign in using the original demo login email. Editing a contact email is not a verified login-email migration.

## Test report

Validation completed on 2 November 2026: 72 tests passed (63 existing and 9 new), with zero failures, cancellations or skipped tests. Existing tests cover homepage, catalogue, cart, checkout, authentication, order history, failure handling and identity isolation. New tests cover address CRUD/default invariants, invalid forms, corrupt storage, whitelisted persistence, customer isolation, protected pages, password availability/validation, checkout prefilling and logout/relogin restoration through the application store. Source changes were self-reviewed; independent review remains pending.

| Check                                          | Result                                                   |
| ---------------------------------------------- | -------------------------------------------------------- |
| TypeScript (`npm.cmd run typecheck`)           | Passed                                                   |
| ESLint (`npm.cmd run lint`)                    | Passed                                                   |
| Automated tests (`npm.cmd test`)               | Passed: 72/72, zero failures                             |
| Production build (`npm.cmd run build`)         | Passed                                                   |
| Prettier on changed source, tests and docs     | Passed                                                   |
| `git diff --check`                             | Passed                                                   |
| Live mobile/desktop visual inspection          | Unexecuted: no browser automation installed or connected |
| Interactive keyboard/screen-reader walkthrough | Unexecuted: requires browser/manual review               |
| Independent code review, PR approval and merge | Pending reviewer/GitHub workflow                         |

Vite's existing concurrent SSR tests may emit an HMR port-in-use warning while tests pass. PowerShell blocks npm.ps1 on this machine; use npm.cmd and npx.cmd. Prettier was fetched as a one-off tool; package dependencies were unchanged.

## Manual review checklist

1. Sign in using fictional data. Edit profile, cancel a draft, save valid details and test `fail@example.com` to confirm failures preserve the prior profile.
2. Add two addresses, edit each, switch defaults, cancel a deletion, confirm deletion of the default and finally delete the last address. Try empty and oversized fields.
3. Save preferences, change them and cancel. Refresh, sign in with the original demo login email and confirm profile, addresses and preferences return.
4. Add a product to cart. Verify profile/default-address prefilling, select another address, enter a manual address and submit a demo order. Confirm cart clearing, confirmation and order history remain correct.
5. Log out, visit protected routes and check guest checkout. Sign in with a different demo email and verify account isolation.
6. At 375px and desktop widths, inspect cards, forms, wrapping and navigation. Use Tab/Shift+Tab, Enter and Space; verify form labels, invalid-field focus, feedback, password visibility and focus following address actions. Confirm password submission stays disabled.
7. Block browser storage and confirm edits remain usable with visible persistence failure feedback.

## Limitations and handoff

Secure authentication, password changes, verified email changes, server validation, real delivery addresses, notification delivery, cross-device and cross-tab synchronization, and account deletion are deferred. Local mock records remain in browser storage after logout; browser site-data controls can clear them. Existing demo authentication is not a production security boundary.

Implementation and automated verification do not satisfy the full definition of done until browser QA, independent review, PR approval and merge into `develop` are complete. No merge into `main` or `develop` is performed here.

The PR body and exact requested title are prepared in `MILESTONE-6-PR.md`, targeting `develop` from `feature/customer-account`. A live GitHub PR was not created: this environment has neither the GitHub CLI nor a connected GitHub tool. Changes remain local and uncommitted for review.
