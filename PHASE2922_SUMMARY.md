# Phase2922 — Fully Typed Runtime Scanner Operations

This phase adds domain operations to explicit Laravel route-source selection and routes the upstream route composition consumer through that operation.

- Added `ExplicitRouteSourceFileVisitorInterface` and `ExplicitRouteSourceSelectionOperations.visitFiles`.
- The explicit route selection authority is still exported as an interface-first immutable runtime object.
- `routeDeclarationCompositionAuthority.resolveSourceFiles` consumes `intent.selection.visitFiles(...)` instead of reading `intent.selection.files` directly.
- Explicit source-file evidence and the distinction between default selection and explicit selection are preserved.
- Exported the new operation contracts through `packages/core/src/index.ts`.
- Added focused tests for stable order and empty explicit selection.
- Added audit command `audit:phase2922-route-source-selection-domain-operations`.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Validation

- Structural audit: 11/11 passed.
- TypeScript `transpileModule` syntax diagnostics: 0 across the 4 modified/added TypeScript files.
- ZIP integrity: checked separately after archive creation.
- Vitest, full typecheck, build, and CLI E2E: not run; do not infer they pass.

## Remaining work

The explicit selection still stores `readonly SourceFile[]` internally. This phase adds an operation boundary but does not claim to eliminate all `SourceFile[]`, `switch`, or primitive checks across the project. The next trace should evaluate whether this selection should own `SourceFileInventory` and model default-vs-explicit and missing-file outcomes as domain operations without moving CLI dependencies into core.
