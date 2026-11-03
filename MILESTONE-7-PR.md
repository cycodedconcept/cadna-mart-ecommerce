# docs: audit milestone 7 API integration contracts

Target: `develop` from `feature/milestone-7-api-integration`. Open as a **draft**: API integration is blocked, not complete.

Milestone 7 requires verified commerce API contracts, but the frontend has only local demo adapters and no API specification/base URL. This change records the repository audit, discovery evidence, per-feature integration matrix, blockers and implementation plan in `MILESTONE-7.md` without changing existing UI or Redux behavior.

`origin/develop` at `83554af` includes Milestone 6 (`ccf1f4c`, merged via PR #8). The public `CADNA_BACKEND` candidate was inspected and describes an assessment/exam service; its authentication cannot be assumed to serve CADNA MART. Private Postman discovery is unavailable while the CLI is signed out.

Validation on the integration base: ESLint, TypeScript and production build passed; 72/72 automated demo tests passed. Live commerce integration and browser journey testing remain unexecuted. No API endpoint, authentication mechanism or payment flow was invented.

Before implementation can continue, provide the authoritative commerce backend repository/OpenAPI/Postman contract and base URL, including session/authentication and error semantics. Keep demo behavior until verified replacements are ready. The earlier uncommitted Vercel refresh fix is excluded from this audit delivery.

Do not mark Milestone 7 complete or merge this draft as an API integration implementation.
