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
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Product catalogue milestone

See [MILESTONE-2.md](MILESTONE-2.md) for routes, architecture, changes, validation, limitations, manual QA and the prepared PR description. Use Node 24+ for `npm test`; run `npm run typecheck`, `npm run lint`, and `npm run build` for validation. Configure an SPA fallback to `index.html` for deep links.

## Shopping cart and checkout milestone

See [MILESTONE-3.md](MILESTONE-3.md) for cart/checkout routes, state, files, validation, limitations, manual review and the prepared PR summary. Checkout is a local demonstration; no live order or payment is made.

## Customer authentication and account milestone

See [MILESTONE-4.md](MILESTONE-4.md) for demo registration/login/recovery, protected account/profile routes, credential handling, session behaviour, tests and PR preparation. Demo authentication and profile edits are memory-only; refresh ends the session while the shopping cart remains persisted.

## Customer order history milestone

See [MILESTONE-5.md](MILESTONE-5.md) for persistent demo order history, account statistics, routes, data isolation, checkout integration, validation and PR preparation. Refresh ends the demo session; sign in with the same fictional login email to retrieve saved orders. Persisted order history uses fictional delivery details and excludes entered customer/contact information.
