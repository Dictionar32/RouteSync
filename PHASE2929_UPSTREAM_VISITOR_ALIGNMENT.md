# Phase 2929 — Reuse the Existing Upstream Visitor Contract

## Decision

The issue was not that visitors should be removed. The route-source observation introduced a second, specialized visitor protocol with `visitScanned` and `visitAbsentOptionalDefault`, forcing the runtime caller to provide a no-op callback returning `undefined` for a variant that must not be read.

Phase2929 keeps the visitor pattern and aligns it with the established upstream contract: `SourceFileInventoryVisitorInterface` in `packages/core/src/types/upstream/names.ts`, whose only operation is `visit(sourceFile)`.

## Changes

- `LaravelRouteSourceFileObservationOperations` now exposes `visitScannableSource` using the canonical upstream visitor.
- A scanned observation invokes `visitor.visit(file)`.
- An optional absent-default observation intentionally does not invoke the visitor.
- The ready judgment exposes `visitScannableSources` using the same upstream visitor contract.
- The scanner schedules reads through `visitScannableSources({ visit })`; there is no `visitAbsentOptionalDefault: () => undefined` callback.
- Tests assert that both observation variants remain in the judgment while only the scanned variant is dispatched to the scanner visitor.
- `packages/core/src/types/upstream/collections.ts` remains empty.

This is not a claim that all reasoning has disappeared from the scanner. It is a focused correction to visitor ownership and protocol consistency. The default-versus-explicit absence policy and filesystem observation remain separate concerns and still require their own domain-level review.

## Validation

Run `npm run audit:phase2929-upstream-visitor-alignment`. Structural audit only; no full typecheck, build, Vitest, or CLI E2E claim is made unless those commands are executed successfully in an environment with project dependencies installed.
