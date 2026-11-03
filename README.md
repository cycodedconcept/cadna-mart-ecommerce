# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

## Vercel deployment

Deploy with the Vite framework preset, build command `npm run build`, and output directory `dist`. Set the Vercel Root Directory to the folder containing `package.json` and `vercel.json`.

The root `vercel.json` rewrites page requests to `index.html` so direct visits and refreshes on routes such as `/catalogue`, `/cart`, and `/account/addresses` load the React router. Commit and push this configuration to the connected deployment branch, then redeploy for the change to take effect. Refreshing protected account pages still requires demo sign-in because sessions are memory-only.

## Product catalogue milestone

See [MILESTONE-2.md](MILESTONE-2.md) for routes, architecture, changes, validation, limitations, manual QA and the prepared PR description. Use Node 24+ for `npm test`; run `npm run typecheck`, `npm run lint`, and `npm run build` for validation. Configure an SPA fallback to `index.html` for deep links.

## Shopping cart and checkout milestone

See [MILESTONE-3.md](MILESTONE-3.md) for cart/checkout routes, state, files, validation, limitations, manual review and the prepared PR summary. Checkout is a local demonstration; no live order or payment is made.

## Customer authentication and account milestone

See [MILESTONE-4.md](MILESTONE-4.md) for demo registration/login/recovery, protected account/profile routes, credential handling, session behaviour, tests and PR preparation. Demo authentication and profile edits are memory-only; refresh ends the session while the shopping cart remains persisted.

## Customer order history milestone

See [MILESTONE-5.md](MILESTONE-5.md) for persistent demo order history, account statistics, routes, data isolation, checkout integration, validation and PR preparation. Refresh ends the demo session; sign in with the same fictional login email to retrieve saved orders. Persisted order history uses fictional delivery details and excludes entered customer/contact information.

## Customer profile, addresses and settings milestone

See [MILESTONE-6.md](MILESTONE-6.md) for saved profiles, address management, preferences, checkout integration, test results and deferred backend work. Profile edits now persist locally alongside addresses and preferences; this supersedes the memory-only profile behavior described in Milestone 4. Refresh still ends the demo session. Use fictional data and sign in with the original demo login email to restore account data, including after editing the profile contact email. Password changes remain unavailable. The prepared PR description is in [MILESTONE-6-PR.md](MILESTONE-6-PR.md).

## API integration audit

Milestone 7 is blocked on verified commerce API contracts. See [MILESTONE-7.md](MILESTONE-7.md) for the repository audit, integration matrix, discovery evidence, validation and implementation plan, and [MILESTONE-7-PR.md](MILESTONE-7-PR.md) for the draft PR description. Existing demo behavior remains in use; no live API or API environment variable is configured.

## Production readiness and validation

See [MILESTONE-8.md](MILESTONE-8.md) for the readiness decision, API verification matrix, test/security/performance findings and handover checklist. This remains a frontend demo: production commerce is blocked on verified backend contracts, hosted preview checks and review approval. Milestone 7's audit is carried into the Milestone 8 review branch; it was not assumed merged into develop.

Use Node 24. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`. For Chromium customer journeys, run `npx playwright install chromium` then `npm run test:e2e`. See [docs/TESTING.md](docs/TESTING.md) for CI, viewport coverage and demo-only test limits, and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for environment configuration, Vercel preview setup, refresh troubleshooting and release prerequisites. No environment variables are currently required.
