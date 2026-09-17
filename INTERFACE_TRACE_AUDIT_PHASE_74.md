# INTERFACE TRACE AUDIT - PHASE 74

## Scope
Interface/ADT only. Producer, factory, scanner, consumer, and data-flow migration are intentionally deferred.

## Trace finding
`modelEntityDefinition.ts` contained complete `ResourceDefContract` and `ModelDefContract` definitions, but the exported canonical `ResourceDef` and `ModelDef` types still used legacy optional fields (`?`) and nullable provenance. This created a second, weaker domain contract beside the claimed complete contracts.

## Repair
- `ResourceDef` is now an alias of `ResourceDefContract`.
- `ModelDef` is now an alias of `ModelDefContract`.
- Removed the legacy optional/nullable canonical shapes.
- Added a Phase 74 compile-time contract test.

## Invariant
Canonical domain definitions have one shape only:
- 0 optional fields
- 0 nullable fields
- complete provenance
- complete model/resource identity

Partial scanner data must not enter these canonical types without an explicit normalization boundary.

## Deferred
Existing producers/consumers that still construct the old shapes are intentionally not migrated in this phase. Their compile failures are expected evidence of remaining flow work.
