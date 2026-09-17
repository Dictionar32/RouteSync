# INTERFACE TRACE AUDIT — PHASE 61

## Target

Laravel AST semantic boundary: `packages/core/src/types/domain/boundAst.ts`.

## Trace

```text
Laravel PHP source
  -> PHP syntax AST
  -> resolved/bound semantic AST
  -> RouteSync semantic types
  -> downstream lowerers
```

Phase 61 changes only the **interface boundary** of the bound semantic AST. Producer and consumer flow are intentionally not migrated yet.

## Problems found

- `semanticType: string` discarded the already-resolved semantic model.
- `isCollection: boolean` encoded a two-state ADT as a loose flag.
- `nullable: boolean` encoded another semantic ADT as a loose flag.
- `relationType: string` allowed arbitrary relation vocabulary.
- `BoundUnknownNode.rawExpression: string` leaked parser text into semantic data.
- `reason: string` allowed arbitrary failure states.
- `returnType: string` and `resultingType: string` forced downstream reparsing/reclassification.

## Corrections

- Semantic results now use `SemanticType`.
- Cardinality uses `BoundCardinality`.
- Nullability uses `BoundNullability`.
- Eloquent relation kinds use a closed union.
- Unsupported states use `BoundUnsupportedNode` with a closed reason union.
- Visitor vocabulary is exhaustive and closed.

## Intentional compile breakage

Existing producers/consumers still construct the legacy shape. That is expected. They are not changed in this phase because the agreed sequence is:

1. interface/ADT
2. invariant
3. producer/scanner
4. consumer/lowerer
5. end-to-end regression

## Ecommerce-shop implication

For `RegisterResponse`, declared DTO semantics remain upstream authority. A runtime `null` value must not replace `mixed`/nullable semantic information with `unknown`. The bound AST must carry the declaration-derived `SemanticType` downstream.
