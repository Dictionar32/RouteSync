# Phase2975 — Pass Graph Domain Ownership

## Scope

This phase migrates one coherent consumer domain of the deleted relation foundation: compiler pass graph analysis, producer ownership, adjacency, dependency validation, and topological ordering. It does not recreate `relationMembership`, `relationalSequence`, or `semanticRelations` under a new generic name.

## Domain model

`PassGraphAnalysisInterface` now owns graph-specific operations:

- `producerOf(artifact)` resolves the pass that owns an output artifact.
- `containsRemainingProducer(artifact, remaining)` determines whether a dependency still blocks a pass layer.
- `dependentsOf(artifact)` returns passes that consume the artifact.

`passGraphAnalysisOperations` owns graph construction and validation. `passGraphOrderingOperations` owns parallel-layer and topological-order resolution. Both are explicitly typed frozen object exports. The `PassGraph` facade delegates to these domain operations.

The adjacency and producer collections are derived indexes of the graph's pass descriptors, not a generic semantic relation foundation.

## Preserved domain evidence

The migration preserves explicit validation for empty and duplicate pass names, duplicate outputs, external-input/output conflicts, multiple producers, missing providers, producer constraints, and cycles. An external input remains distinct from a missing provider: when an artifact is declared external, the graph can validate a consumer without inventing an in-graph producer.

## Runtime trace

`PassGraph` → `passGraphOrderingOperations` → `passGraphAnalysisOperations` → validated producer ownership / dependency graph → deterministic parallel layers or topological order.

This is a coherent compiler-runtime domain slice reachable through the compiler's pass orchestration. The existing upstream → CLI → manifest composition is unchanged by this phase; the audit records this as a bounded consumer migration rather than claiming that every transitive relation import has been migrated.

## Verification

Run `npm run audit:phase2975-pass-graph-domain-ownership` for the structural audit. The audit checks that the migrated graph files no longer import the deleted relation foundation, runtime operations are explicit interface-typed objects, the facade delegates to the domain operations, and regression tests cover graph continuations and external-input evidence.

A full typecheck/build and test run has not been claimed. The repository still has other consumers of the deleted relation foundation outside this migrated graph domain; those must be classified and migrated domain-by-domain without restoring a generic foundation.
