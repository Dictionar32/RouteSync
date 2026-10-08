# Phase 980 — Upstream migration/model/dataflow closure

## Changes

- Added `MigrationInterface` as the closed migration semantic input to `SchemaProducer`.
- `SchemaProducerInput` no longer accepts `MigrationAsts`; AST migration discovery is adapted once at the scanner boundary.
- `SchemaInterface` no longer extends `SchemaAst`; the AST remains only as a compatibility/discovery projection.
- `InvalidationResolver` now consumes `ModelSemanticDefinition[]` and reads canonical `model.relation.semantic`; it no longer traverses `ModelAst` or reconstructs relation semantics.
- Legacy `StaticLaravelScanner` no longer exposes `resolveRouteInvalidations`; consumers use the explicit scanner/subscanner surface instead of a facade compatibility helper.
- `SemanticDataflowJudgment` remains the sole fixed-point authority; no second solver or manifest closure was introduced.
- Graph relation projection continues to preserve canonical model relation provenance.

## External alignment

Laravel route model binding distinguishes implicit, explicit, custom-key, and scoped binding semantics; RouteSync therefore keeps route binding separate from FK/Eloquent relation evidence.

CodeQL models dataflow as a semantic graph rather than an AST-shaped graph and separates source/sink configuration from the solver/path result. MLIR similarly uses interfaces so analyses do not encode concrete operation knowledge, while its dataflow solver owns fixed-point iteration.

## Audit invariants

- `SchemaProducerInput.migrations` is `readonly MigrationInterface[]`.
- `SchemaInterface` is closed and not an `extends SchemaAst` alias.
- `InvalidationResolver` has no `ModelAst` import.
- `InvalidationResolver` consumes `ModelSemanticDefinition` and canonical `relation.semantic`.
- No direct `linkGraph` call is introduced.
- No second dataflow solver is introduced.
- Legacy unused files remain present; none are deleted by this phase.
