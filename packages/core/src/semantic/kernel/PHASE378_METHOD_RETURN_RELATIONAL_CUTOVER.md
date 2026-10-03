# Phase 378 — Method-return relational authority cutover

This phase extends the relational semantic authority from the generic resolver boundary into the Eloquent method-return reservoir.

## Migrated surfaces

- `EloquentRegistry` now exposes `lookupEloquentMethodRelation` as the semantic lookup relation.
- instance method resolver dispatch uses `relationRefine`, `relationOptionFold`, and semantic target relations.
- instance method resolution consumes method-rule relations rather than host absence sentinels.
- static method resolution uses model lookup + method-rule lookup relations.
- `selectRaw` literal extraction uses a tagged relation option; projection rendering uses `relationProject`.
- method-return support vocabulary no longer uses `unknown` as a semantic fallback name.

## Authority model

`source evidence -> semantic candidate relation -> constraint/refinement -> lookup witness -> rewrite/resolution -> fixed-point consumer`

No semantic decision in these files is delegated to host `if`, `for`, `while`, `switch`, collection `map/filter/reduce/flatMap`, `undefined`, `??`, strict equality, TypeScript `as`, or the semantic `unknown` escape hatch.

PHP source-level `null` remains a language value elsewhere; this phase does not confuse that value with host absence.

## Validation

AST audit: zero violations for all prohibited implementation constructs across the six migrated authority files.

Targeted TypeScript check: no diagnostics originating from the six migrated files except the pre-existing `ModelDefinition` versus `ModelSemanticDefinition` contract mismatch in `staticMethodResolver`; that mismatch predates the relational cutover and is not an authority-control construct.
