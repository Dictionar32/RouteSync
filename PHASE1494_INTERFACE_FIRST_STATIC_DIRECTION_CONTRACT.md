# Phase 1494 — Interface-first static operation contract

## Change

`queryProducerSemanticAlgebra.resolveModelOrigin` now rejects a known `orderBy` model-static operation when its optional direction argument is not accepted by the upstream `resolveOrderingDirection` authority. This closes a semantic gap where model-origin validation could accept the static operation while operation projection later discarded its ordering operation.

A regression test covers `User::orderBy('created_at', 'sideways')` and expects a `malformed` judgment from upstream.

## Architectural boundary

- `queryProducerSemanticAlgebra` owns this validity rule.
- The scanner remains responsible for expression/argument extraction and AST projection.
- This phase does **not** claim that the full `modelStaticOperationCatalog` has moved out of the scanner. That remains a larger migration because its entries construct `QueryOperationAst` values and depend on scanner-side expression/sequence helpers.
- Legacy option projection still loses malformed/not-applicable distinctions for older operation lanes; those consumers must be migrated individually before the scanner can be considered a pure executor.

## Verification status

Source-level change and regression test added. Build/test execution must be reported separately based on the actual environment; this note does not assert that they passed.
