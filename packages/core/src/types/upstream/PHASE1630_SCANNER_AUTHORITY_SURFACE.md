# Phase 1630 — Scanner authority surface

## Contract change

`packages/core/src/compiler/frontend/php/routeAst/semanticRewriteInterface.ts` is a consumer-facing compatibility facade. It exports the upstream semantic protocol and `solveClosedSemanticRelations`, but no longer re-exports the concrete `semanticRewriteAuthority` or `createSemanticRewriteRuntimeExecutor` factory.

## Why

The concrete authority and executor factory are composition details owned by `types/upstream`. Re-exporting them from scanner creates an easy path for production scanner consumers to construct parallel runtime instances or bypass the canonical binding. The canonical executor remains available through the upstream module/index.

## Scope boundary

This phase does not delete `semantic/foundation`: upstream authority still imports the generic solver there, and scanner has many foundation references. Those references require semantic ownership classification before any folder removal. This phase also does not claim all scanner reasoning has migrated.

## Validation

Run `npm run audit:phase1630-scanner-authority-surface`. It checks the scanner facade surface and records remaining direct solver call sites as an inventory rather than asserting that every call is invalid.
