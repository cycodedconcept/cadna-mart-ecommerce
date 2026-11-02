# feat: implement customer profile and address management (milestone 6)

Base: `develop`  
Head: `feature/customer-account`

## Changes

Customers can now keep a local demo profile, manage saved delivery addresses and communication preferences, and choose a saved address at checkout. Account navigation includes protected address and settings pages. The first saved address becomes the default; deleting the default selects the first remaining address.

Reuse the existing authentication identity, profile forms, Redux store, account layout and validation. Persist only whitelisted mock profile/address/preference fields under the stable customer ID. Refresh still ends the demo session; signing in with the original demo login email restores account data. Storage failures retain changes in memory with visible feedback.

The password-change preview validates inputs and supports visibility toggles. Submission is explicitly unavailable until secure backend integration; passwords never enter Redux or persistence. Existing guest checkout and historical order snapshots are preserved.

## Validation

See [MILESTONE-6.md](MILESTONE-6.md) for the final test report, architecture, manual QA checklist and deferred integrations. Tests use the existing Node/Vite SSR framework; no runtime or testing dependencies were added.

TypeScript, ESLint, all 72 automated tests (63 existing and 9 new), production build, Prettier formatting and whitespace checks passed. Browser visual and interactive keyboard QA remain unexecuted.

## Review requirements

- Run the documented mobile/desktop and keyboard walkthrough.
- Review customer isolation, profile-email identity semantics and storage failure behavior.
- Obtain independent review and approval before merging into `develop`.

This file prepares the PR content. It is not evidence of a published, approved or merged GitHub PR.
