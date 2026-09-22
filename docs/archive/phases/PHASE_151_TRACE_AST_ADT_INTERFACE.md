# Phase 151 — Trace AST/ADT → Binding Path → Traversal

## Trace

Flow inspected:

`ecommerce_shop → PHP AST → ResourceExpression ADT → ResourceBindingPath → ResourceTraversal`

### Finding 1 — traversal state was never carried

`resourceBindingTraversalBuilder.ts` declared `state`, but it was permanently `undefined`. Every member/method therefore started with an unresolved receiver model. This was semantic information loss, not merely an implementation-style issue.

### Finding 2 — traversal received no model catalog

The traversal builder had enough information to know that a root was a model, but it did not receive the canonical `ResourceBindingModelCatalog`. Therefore it could not turn a model root into a semantic `ResourceQueryState`.

## Repair

`createResourceTraversal` now receives the existing canonical `ResourceBindingModelCatalog` from the binding path builder.

A semantic `TraversalState` was introduced locally as the state carrier:

- `query: ResourceQueryState`
- `target: ResourceTraversalTarget`
- `cardinality: ResourceTraversalCardinality`

This is not a parallel scanner interface. It is the state required to carry meaning through traversal.

### Root elevation

A known model root now creates:

`model root → ModelSemanticDefinition → model_instance → ResourceTraversalTarget.model`

### Property elevation

A model property is resolved from the canonical model surface. Its semantic type is carried directly into the traversal target.

### Relation elevation

A relation now carries:

`relation → target model → cardinality → traversal target → next model state`

### Method elevation

A resolved `ResourceMethodResult` now becomes the next traversal state. Query builder, single model, collection, paginated collection and scalar results each carry their own semantic target/cardinality.

## Result

Before:

`root → undefined state → unresolved receiver → pending/rejected`

After:

`root → semantic state → member/method meaning → semantic target → next semantic state`

The traversal no longer needs to rediscover the meaning of the current receiver from raw syntax.

## Ternary / if / switch rule

The remaining `switch` functions are centralized algebra/catamorphism boundaries over closed ADTs. They are not downstream re-classification. The important invariant is that consumers receive an already-classified semantic result.

No mechanical removal of syntax dispatch was performed where dispatch is the AST/ADT decoding boundary.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit` still reports only the pre-existing environment blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error was introduced by Phase 151.
