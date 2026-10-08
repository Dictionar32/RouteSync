# Phase 375 — Semantic Indeterminate + Relational Resolver Cutover

## Authority objective
Move semantic resolution absence/indeterminacy out of the `unknown` state and remove host control-flow constructs from the resolver authority path.

## Changes
- `SemanticResolution.kind: 'unknown'` -> `kind: 'indeterminate'`.
- `ResolutionStatus: 'unknown'` -> `indeterminate`.
- `SemanticResolutionFactory.unknown` -> `indeterminate`.
- `matchSemanticResolution` uses relational refinement/folding instead of `switch`.
- Ternary, binary, property-access and semantic resolution support use `indeterminate`.
- Expression and method-return plugin dispatch uses relation rule selection rather than `??`/optional dispatch/casts.
- Primitive resolver is reduced to type-cast resolution; literal resolution is owned by the expression relation resolver.
- `PrimitiveKind.UNKNOWN` -> `PrimitiveKind.INDETERMINATE` internally.
- Semantic-resolution bound-type projection uses `relationProject` rather than `.map`.

## Verification
- `scripts/audit-phase375-semantic-indeterminate.cjs`: zero forbidden AST constructs across 13 authority files.
- TypeScript transpilation syntax check: zero diagnostics across 10 changed semantic files.
- Full type-check remains environment-blocked because the workspace dependency tree lacks `@types/node` and `vitest/globals`.

## Null boundary
PHP/source null remains represented as a tagged semantic literal (`kind: 'null'`) where it is source-language data. It is not used as an absence/control sentinel.
