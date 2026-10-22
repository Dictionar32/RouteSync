# Phase 2348 — CLI Route Source Blocker Propagation

- Removed duplicate route-file existence preflight exceptions from CLI `scan` and `sync`.
- Preserved explicit route-file selection as CLI input wiring and delegated missing-file judgment to the existing upstream `LaravelRouteScannerInterface`.
- Preserved typed blocker propagation through source-AST projection and manifest-builder ADTs to the existing CLI error branches.
- Added `scripts/audits/audit-phase2348-cli-route-source-blocker-propagation.cjs` (15/15 checks pass).
- Did not run type-check, Vitest, CLI end-to-end, or `npm run build`.
