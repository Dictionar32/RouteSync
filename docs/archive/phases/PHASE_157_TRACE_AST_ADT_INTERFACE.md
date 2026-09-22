# Phase 157 — Trace AST → ADT → Interface

## Trace

`ResourceMethodInvocation` previously accepted an optional `ResourceModelSurface`. Projection resolution then read `arguments_[0]` directly and used ternary/undefined checks to reconstruct whether the argument represented a property.

This was an interface gap: the semantic model already owns the canonical `ModelSemanticDefinition.surface`, but the resolver did not expose that fact as a complete input.

## Repair

1. `ResourceResolvedQueryOperation` is now the source for projection dispatch in `resolveResourceMethodInvocation`.
2. `resolveProjectionInvocation` consumes a typed projection operation rather than raw `arguments_[0]`.
3. `ResourceModelSurface` now has `createResourceModelSemanticSurface(model: ModelSemanticDefinition)`, derived directly from the existing semantic SSOT.
4. `resolveResourceMethodInvocation` no longer accepts `surface?`; it always derives the semantic surface from `state.model`.
5. Projection method dispatch moved from a `switch(method)` to a typed handler registry.
6. Projection handlers receive a semantic projection context: property, semantic property, and semantic type.

## Result

Before:

`raw arguments → optional surface → arguments[0] → infer property → switch method`

After:

`semantic model → semantic surface + resolved query operation → projection meaning → typed handler registry → ResourceMethodResult`

The downstream resolver no longer needs to reconstruct projection meaning from the raw expression argument.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Only the existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 157.

## Next trace target

`resourceModelMethodResolverOperation.ts` still contains multiple argument-level `undefined` branches. The next elevation should make each query operation's argument contract explicit at the operation ADT boundary, so invalid argument shape becomes a first-class semantic result rather than a sequence of optional checks.
