# Phase 155 — Trace AST/ADT/Interface

## Flow
`ecommerce_shop → PHP AST → AST ADT → Semantic Model ADT → Traversal`

## Trace finding
`ModelSemanticProperty` already classified a member as column/accessor/relation, but `resourceBindingTraversalBuilder.ts` re-derived the traversal meaning by inspecting `property.value.kind` and separately recomputing relation cardinality.

That duplicated semantic decision in downstream traversal.

## Interface elevation
`ModelPropertyTraversalMeaning` was added to the canonical `ModelSemanticProperty` variants:

- scalar → semantic type
- relation → target model, cardinality, semantic type

The canonical model descriptor now constructs this meaning at the model semantic boundary for columns, accessors, and relations.

## Downstream repair
`resourceBindingTraversalBuilder.ts` now consumes `property.value.traversal` through `propertyTraversalHandlers`.

The builder no longer asks whether the raw semantic property is a relation or scalar. The semantic property already carries that meaning.

## Result
Before:
`property → inspect kind → infer scalar/relation → infer cardinality → build traversal`

After:
`property → traversal meaning → build traversal`

The registry is an implementation detail; the semantic decision lives in the interface.

## Validation
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: no new TypeScript errors. Existing environment blocker remains:
`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

## Next trace target
`resourceModelMethodResolver.ts` still contains optional `elementType`, non-null assertions, ternary scalar typing, and a central switch over method meaning. The next elevation should make each `ResourceModelMethodMeaning` produce a complete traversal/result projection so the resolver does not reconstruct missing data.
