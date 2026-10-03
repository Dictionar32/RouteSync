# Phase 420 — Scanner Resolver Relational Query Dispatch

## Scope

Migrated the query resolver's named-method dispatch boundary in
`packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`.

## Structural change

- Replaced the imperative `ReadonlyMap` catalog with a canonical relational tuple catalog.
- Removed the catalog's `.entries()` materialization from resolution.
- `queryOperationFromNamedMethod` now resolves the domain/query boundary through relations.
- Named resolver lookup is performed directly through `relationLookup`.
- Domain-name extraction no longer uses a conditional expression.
- The query/domain dispatch remains a relation gate; rule bodies remain untouched to avoid a blind codemod.

## Research basis

MLIR PDLL/PDL separates match and rewrite into a high-level representation; MLIR DRR models source/result patterns declaratively. Soufflé treats typed tuples as relations, while egglog combines equality saturation with Datalog. JastAdd demonstrates circular attribute evaluation as declarative fixed-point computation.

## Validation

- TypeScript `transpileModule`: 0 diagnostics for the modified resolver.
- No runtime claim is made without the project's full dependency/test environment.
- This phase is intentionally incremental: rule-body constructs such as `undefined` and ternary expressions remain a later frontier rather than being mechanically rewritten.
