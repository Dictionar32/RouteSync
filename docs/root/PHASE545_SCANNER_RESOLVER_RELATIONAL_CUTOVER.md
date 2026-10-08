# Phase 545 — Scanner Resolver Relational Cutover

Phase 545 continues the scanner/resolver frontier after Phase 544.

## Research direction

The architecture follows the same higher-level direction exposed by declarative rewrite and constraint systems:

- MLIR PDLL separates match constraints from rewrite actions.
- MLIR PDL represents patterns as IR so matching/rewrite infrastructure can itself be verified and optimized.
- MLIR DRR expresses source patterns, result patterns, and additional constraints declaratively.
- egglog combines equality saturation with Datalog-style relational reasoning.
- Statix models name resolution with scope-graph constraints.
- Rascal exposes transitive closure as a first-class relation operation.

RouteSync therefore treats scanner syntax as evidence and moves classification/derivation decisions into relation gates, recursive folds, candidate witnesses, and canonical semantic construction.

## Closed frontier

Targets:

- `packages/core/src/compiler/scanner/descriptors/manifest/resourceRouteGroupDescriptor.ts`
- `packages/core/src/compiler/scanner/subscanners/semantic/modelTypeDeriver.ts`
- `packages/core/src/compiler/scanner/subscanners/model/eloquentProducer.ts`

The first target was already syntactically closed and was retained as the descriptor authority while the latter two were migrated.

### `modelTypeDeriver.ts`

- sequence traversal is recursive relation evaluation;
- model accumulation uses `relationFold`;
- property projection uses `relationProject`;
- duplicate-name admission is a relation predicate;
- property-origin classification is a relation-gated semantic choice;
- no host `if`, `for`, `while`, ternary, strict equality, logical-and/or, absence sentinel, or banned collection method remains.

### `eloquentProducer.ts`

- method-chain admission is a relation gate;
- receiver identity is a relation conjunction;
- relation-method classification is a candidate gate;
- explicit class-reference discovery is an option witness;
- multiplicity drives semantic type/shape/traversal through relation gates;
- no imperative branch statement or banned operator/method remains.

## Audit

`audit:scanner-lexer:phase545` reports:

- `closedSurfaceClean: true`
- `transpileDiagnosticsClean: true`
- `ok: true`

Phase 544 and Phase 543 regression audits also pass.

Repository-wide TypeScript checking remains environment-limited by missing `node` and `vitest/globals` type definitions; target-level transpilation is clean.
