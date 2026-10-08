# Phase 505 — Controller Expression Relational Cutover

## Objective

Move `descriptors/request/controllerExpressionContract.ts` away from host-language control/absence/operator constructs and make the scanner/resolver boundary a semantic relation projection.

## Research synthesis

The design follows several external declarative-analysis patterns:

- MLIR PDLL/PDL separates pattern matching from rewrite and represents the pattern itself as an intermediate abstraction.
- MLIR declarative rewrite rules describe source patterns and result patterns instead of imperative traversal.
- Rascal treats extracted program models as facts that can be composed and closed transitively for analysis.
- Statix/scope-graph work motivates explicit semantic relations and constraint-driven resolution.

## Cutover

`controllerExpressionContract.ts` now uses:

- `relationGate` for semantic dispatch;
- `relationEqual` for relation predicates;
- `relationProject` for sequence projection;
- explicit `ControllerNullLiteral` instead of a runtime null sentinel;
- semantic names `conditional_expression`, `presence_fallback`, and `fallback_coalesce`;
- semantic statement names `conditional_statement`, `collection_recurrence`, and `counted_recurrence`;
- recursive relation projection for arguments, arrays, match arms, statements, catches, and clauses.

The file contains no host-level `if`, `for`, `while`, `switch`, collection combinators, absence sentinel, nullish/equality operators, casts-to-unknown, logical operators, trim/slice calls, or ternary expressions in the audit surface.

## Validation

```text
node scripts/audit-phase505-controller-expression-relational-frontier.cjs
closedSurfaceClean: true
```

Target result:

```text
descriptors/request/controllerExpressionContract.ts = 0
```

TypeScript `transpileModule` syntax diagnostics for the target: `0`.

Repository-wide typecheck is not claimed because the environment lacks the `node` and `vitest/globals` type definitions required by the repository configuration.

## Next frontier

The largest remaining scanner/resolver surface is `subscanners/resource/resourceFieldProducer.ts`, followed by validation/resource/controller surfaces.
