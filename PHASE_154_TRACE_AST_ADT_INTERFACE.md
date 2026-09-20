# Phase 154 — Trace → Suggest → Fix → Re-trace

## Goal
Elevate `ResourceMethodResult` so traversal meaning is carried by the interface itself. `resourceBindingTraversalBuilder` must not re-classify the same method result into target/cardinality/next-state with a second switch.

## Trace
Before this phase, `ResourceMethodResult` contained semantic result data, while `resourceBindingTraversalBuilder.ts` independently interpreted the same union twice:

- `nextState(result)` reconstructed the next query/target/cardinality.
- `traversalTarget(result)` reconstructed target/cardinality and rejection.

This was duplicated semantic interpretation. Downstream still had to ask what a result meant.

## Suggestion
Elevate a canonical `ResourceMethodTraversalProjection` into the `ResourceMethodResult` interface contract. The projection carries:

- semantic traversal target
- cardinality
- continuation (`query_builder`, `model_instance`, or `retain`)
- explicit rejected reason for value collection / unsupported / unresolved

The resolver is the origin boundary where a method meaning is translated into this projection.

## Fix
Changed:

- `packages/core/src/types/domain/resourceModelMethodSurface.ts`
  - added `ResourceMethodTraversalProjection`
  - made `ResourceMethodSemanticResultBase.traversal` mandatory
  - made unresolved results carry traversal rejection explicitly
- `packages/core/src/types/domain/resourceModelMethodResolver.ts`
  - constructs canonical traversal projections at resolution time
- `packages/core/src/types/domain/resourceModelMethodResolverProjection.ts`
  - scalar/value/aggregate projection results now carry traversal meaning
- `packages/core/src/compiler/scanner/subscanners/resource/resourceBindingTraversalBuilder.ts`
  - removed `nextState(result)`
  - removed `traversalTarget(result)`
  - traversal now consumes `invocation.result.traversal`

## After

```text
ResourceMethodMeaning
        ↓
ResourceMethodResult
        └── traversal
             ├── target
             ├── cardinality
             └── next
                    ↓
            ResourceTraversalBuilder
```

The builder no longer re-classifies `ResourceMethodResult` to recover those meanings.

## Important distinction
The remaining conditional logic in the resolver is origin-boundary construction. It chooses the semantic ADT projection once. It is not downstream reconstruction. The architectural invariant is therefore:

`source syntax → semantic ADT → canonical traversal meaning → dumb traversal consumer`.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: no new TypeScript errors. Existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

## Next trace target
The next likely semantic duplication is member/relation resolution in `resolveMember()`, especially where relation cardinality and target are independently reconstructed from `ModelSemanticProperty`. The next elevation should make the model surface itself expose a canonical traversal projection, so member traversal can consume meaning without re-classification.
