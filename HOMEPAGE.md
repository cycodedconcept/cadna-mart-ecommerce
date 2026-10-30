# Homepage milestone

The homepage follows `CEDNA MART IMAGE/Homepage.png` using local artwork extracted from that reference. Original screenshots are unchanged. Banner copy is embedded in the supplied artwork; descriptive alternative text is provided. Replace these crops with original source artwork when available.

- `src/pages/HomePage.tsx`: homepage composition and local demo interactions.
- `src/components/home/ProductSection.tsx`: reusable product grid and cards.
- `src/data/home.ts`: typed mock products, categories, and naira formatting.
- `public/images`: local reference artwork; no remote image requests.

Search and category filters work across all four product sections. Clicking a product adds it to a session-only demo cart. The newsletter validates email input and displays a local confirmation. No data is sent or persisted. Account, seller, partner and footer actions explain that those features belong to future milestones.

Redux configuration is preserved. No backend or admin features are included.

Run `npm run dev` for local development. Validation: `npm run lint`, `npx tsc -b`, and `npm run build`.
