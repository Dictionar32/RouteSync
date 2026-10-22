# Phase 2349 — Legacy RouteScanner Barrel Closure

- Removed the unused legacy `RouteScanner` class from the internal `subscanners` barrel after tracing source-level callers.
- Kept `subscanners/RouteScanner.ts` in place; this phase does not delete or empty the legacy source file.
- Preserved the existing `LaravelRouteScannerInterface` as the canonical route boundary and confirmed source-AST pipeline wiring still consumes `laravelRouteScanner`.
- Added `scripts/audits/audit-phase2349-legacy-route-scanner-barrel-closure.cjs`.
- No `semantic/foundation` dependency or duplicate/V2 scanner contract added.
- Static audit only; no TypeScript type-check, Vitest, CLI end-to-end, or package build run.
