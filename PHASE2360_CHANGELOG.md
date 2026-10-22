# Phase 2360 — Route scanner authority injection

- Added `createLaravelRouteScanner`, reusing `Pick<LaravelRouteScannerInterface, ...>` for dependency typing.
- Scanner execution now uses the exact authority operations supplied at construction rather than reaching back into the exported singleton.
- Preserved the existing CLI pipeline injection and existing interface; no duplicate authority interface added.
- Added `scripts/audits/audit-phase2360-route-scanner-authority-injection.cjs`.
- Broader `semantic/relations` and subscanner dependency migration remains incomplete. No TypeScript typecheck, Vitest, build, or CLI E2E is claimed.
