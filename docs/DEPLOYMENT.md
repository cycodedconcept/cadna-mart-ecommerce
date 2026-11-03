# Environment, deployment and troubleshooting

## Current supported mode

This application is a browser-local commerce **demo**, not a production commerce service. Catalogue, identity, checkout, orders and account data use mocks/Redux/localStorage. No payment is taken, no real order is placed, and refresh ends demo authentication. Use fictional details only. No API base URL is configured or consumed. There is no dependency on XAMPP, a localhost backend, or a development mock server in the production bundle.

No environment variables are required for the current build. `VITE_API_BASE_URL` is a proposed future name, not an implemented setting. Do not populate it expecting the app to switch modes. Any future Vite-prefixed configuration is visible to visitors: never put passwords, private keys, database URLs, backend signing keys or privileged API tokens there. `.env` and `.env.*` are ignored; a reviewed `.env.example` may be committed when a real contract exists.

Before live integration, verify the commerce API origin, HTTPS, request/response/error contracts, session mechanism, authorization, server price/stock checks and backend CORS/CSRF configuration. The frontend repository cannot enforce backend authorization or CORS. Do not enable live authentication while reusing demo identities or silently fall back to simulated order success on API failure.

## Vercel setup and preview

The user identified `https://cadna-mart-ecommerce.vercel.app/` as the existing deployment. Repository configuration is prepared, but account connection, dashboard settings and deployment logs have not been inspected. Web-tool checks could not access the supplied URL; this does not establish that it is offline.

1. In Vercel, open the project connected to `cycodedconcept/cadna-mart-ecommerce`; confirm the repository/root folder containing `package.json` and `vercel.json`.
2. Use Node 24, the **Vite** preset, `npm ci` for installation, `npm run build` for build, and `dist` as output. `vercel.json` declares the framework/build/output and SPA rewrite. No API secrets or variables are needed for the demo.
3. Keep `main` as the intended production branch. Verify this setting in the dashboard; do not change production settings or deploy this feature as production without release approval.
4. Verify preview deployments are enabled for the feature branch/PR and review their build logs. Use the actual generated preview URL, never an assumed URL.
5. On the preview, load and refresh `/`, `/catalogue`, `/products/0`, `/cart`, and `/account/addresses`. Confirm CSS/images load; account URLs should reach demo sign-in, then restore the intended page after sign-in. Verify Back/Forward, cart persistence and the demo disclaimer.
6. Inspect response headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Frame-Options: DENY`. Existing asset files must still serve their real MIME types. These controls do not make demo authentication secure. Embedding this storefront in frames is intentionally disallowed by the frame header.
7. Run the documented fictional customer journey. Confirm checkout is explicitly simulated and no payment/email/API request is claimed. Obtain review approval before preparing a separate release PR from `develop` to `main`.

## Troubleshooting and rollback

| Symptom | Check / action |
| --- | --- |
| Nested page refresh returns Vercel 404 | Confirm the deployment includes root `vercel.json`, output is `dist`, root directory is correct, and a new deployment was built from that commit. Client navigation alone does not verify server routing. |
| `/` itself returns 404 | Check project/root/output settings and build logs; the SPA fallback cannot repair a deployment with no `index.html`. |
| Redirecting screen after opening account URL | Ensure the deployment contains the Milestone 8 router subscription fix. Test direct loading and refresh, then sign-in. |
| Account appears signed out after refresh | Expected memory-only demo session; sign in with the original demo email to restore local records. |
| Saved data missing or warning shown | Browser storage may be blocked/cleared/full. Local data is device-specific; use fictional data. Clearing site data removes demo records. |
| PowerShell rejects npm.ps1 | Use `npm.cmd` and `npx.cmd`. |
| Browser test preview port occupied | Stop only the preview process you own on port 4173; the test runner deliberately refuses to reuse an unrelated server. |
| HMR port warning in Node/Vite SSR tests | Tests may still pass. Check exit code and assertions; browser tests run against the production build with no HMR. |
| Dependency audit reports moderate minimatch issues | See MILESTONE-8.md. Review upstream compatible fixes; do not use `npm audit fix --force` blindly. |

For a faulty approved release, use Vercel's previous known-good deployment following the team's incident/release approval process. Revert the source change through a reviewed PR; do not force-push or bypass protections. Confirm the exact deployment and smoke-test refreshes after rollback. No production release or rollback was performed during this milestone.
