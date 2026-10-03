# Phase 650 — Target Surface + Scanner Relational Cutover

## Scope

This phase continues the RouteSync compiler architecture from Phase 649.

The target is not mechanical removal of PHP/Laravel vocabulary. Source forms such as conditional statements, recurrence statements, null-coalescing expressions, strict comparisons, and resource `any` remain legitimate source evidence. The change removes host-language implementation authority from target lowering and scanner cursor naming.

## Changes

### TypeScript semantic lowering

Added `typeScriptTargetSurfaceRelations.ts` as a declarative target-surface catalog.

Semantic lowering now obtains optional-type, nullable-type, array-type, and optional-property surface fragments through solved relations instead of embedding target-language absence/optionality tokens in the semantic lowerer.

The lowerer also delegates array grammar formatting to `TypeScriptSyntax` and keeps semantic dispatch relation-driven.

### Scanner / lexer

Renamed the cursor operation `scanWhile` to `scanByPredicate` throughout the source-stream contract and its scanner consumers. The operation remains recursive because cursor traversal is an execution mechanism of the lexer, while its public semantic vocabulary no longer names a host-language recurrence construct.

## Unused-file audit

A conservative production TypeScript basename/reference audit found no additional non-empty production file that could be proven unused without risking an active import/export surface. No file was deleted or vacuumed in this phase.

Existing zero-byte files remain preserved as historical vacuumed paths.

## Architectural result

```text
source evidence
  -> relation catalog
  -> constraint witness
  -> semantic solver
  -> canonical semantic type
  -> target-surface relation
  -> TypeScript syntax projection
```

This follows the same separation emphasized by MLIR canonicalization/rewrite infrastructure and by circular reference attribute grammars: semantic rules are declarative, while iteration/evaluation belongs to the solver/evaluator. MLIR's canonicalizer repeatedly applies rewrite patterns until a fixpoint or bounded rewrite limit, while CRAGs express recursive equations whose values are obtained by fixed-point evaluation.

## Vacuumed unused surface

`packages/core/src/types/upstream/routeBinding.ts` was proven unused in the production TypeScript surface. The public `RouteBindingContract` export resolves through `packages/core/src/types/route.ts` to the domain contract, while the upstream `routeBinding.ts` path has no production import/export consumer. The file was truncated to zero bytes rather than deleted, preserving the historical path.
