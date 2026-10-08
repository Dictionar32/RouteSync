# Phase 976 — Upstream Canonical Relation Consumption

Phase 976 closes the remaining model semantic bypass found after Phase 975.

## Closed path

`EloquentRelationAst -> ModelRelationInterface -> SemanticRelationReconciliationInterface -> ModelSemanticRelation -> ModelSemanticSurface -> ModelAst`

`modelCanonical.ts` no longer accepts or reinterprets raw `EloquentRelationAst[]`. It projects relation properties from `ModelSemanticDefinition.surface`, which already contains the canonical reconciled `ModelSemanticRelation` values.

## Ownership

- `SchemaInterface` owns cumulative migration-derived schema evidence.
- `SchemaRelationIndexInterface` indexes schema foreign-key evidence.
- `ModelRelationInterface` owns Eloquent relation evidence plus reconciliation judgments.
- `SemanticRelationReconciliationInterface` owns the Eloquent/schema reconciliation status.
- `ModelSemanticDefinition.surface` carries the canonical semantic relation values downstream.
- `RouteBindingInterface` remains an independent Laravel route-binding evidence boundary.
- `SemanticDataflowInput` remains a seed surface only.
- `SemanticDataflowJudgment` remains the sole dataflow closure/fixed-point authority.

## Regression prevented

The previous `modelAstFromSemantic()` signature accepted raw Eloquent relation evidence and could reconstruct downstream relation semantics independently of the reconciled model interface. Phase 976 removes that input so the canonical relation judgment cannot be bypassed.

## File policy

The legacy `migrationScanner.ts` remains physically present and empty (0 bytes). No unused file is deleted as part of this phase.
