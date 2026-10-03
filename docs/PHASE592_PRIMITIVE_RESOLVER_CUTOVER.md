# Phase 592 — Primitive Semantic Witness + Resolver Relation Cutover

## Purpose

This phase removes `PrimitiveType` as a host-language class/constructor authority and removes constructor-based primitive resolution from the semantic resolver graph.

The semantic primitive is now an immutable tagged witness:

```text
primitive(kind)
   ↓
semantic visitor
   ↓
relation projection
```

rather than:

```text
new PrimitiveType(kind)
```

## Changes

### Semantic type

`packages/core/src/compiler/types/SemanticType.ts`

- `PrimitiveType` is now a structural semantic witness.
- `primitiveType(kind)` is the canonical primitive witness constructor.
- primitive witnesses expose visitor, nullability, optionality, and property-formatting projections as data/functions.
- PHP primitive mapping is no longer implemented by a `switch` in the primitive class.
- reference/object compatibility paths in the touched file avoid host strict equality and nullish coalescing.

### Legacy boundary

`packages/core/src/compiler/compatibility/boundary/legacyResolver.ts`

- `instanceof PrimitiveType` was removed.
- primitive recognition is a semantic-kind relation/TypeScript type guard.

### Resolver graph

`PrimitiveResolver.ts` and `ResourceGraphResolver.ts` are now immutable resolver relation objects rather than resolver class instances.

`defaultPlugins.ts` now consumes those resolver relations directly. Other legacy resolver classes remain a later migration frontier; this phase does not claim the whole resolver graph is constructor-free.

## Global primitive audit

The Phase 592 audit scans all production TypeScript under `packages/core/src` and verifies:

- zero production `new PrimitiveType(...)`
- zero production `instanceof PrimitiveType`
- zero production `class PrimitiveType`

The selected Phase 592 semantic/resolver files are also checked with a TypeScript AST audit for the requested host semantic constructs.

## Validation

- TypeScript transpilation across production source: **0 diagnostics**.
- Full `tsc --noEmit --skipLibCheck`: blocked before project checking by missing `node` and `vitest/globals` type definitions in the current environment.

## Next frontier

The remaining high-authority surfaces are the other resolver classes, scanner/lexer construction, resolver graph closure, AST/upstream provenance, analysis state, and the remaining class-based semantic-type projections.
