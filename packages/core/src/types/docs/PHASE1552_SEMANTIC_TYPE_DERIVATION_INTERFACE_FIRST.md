# Phase 1552 — Semantic Type Derivation Interface First

## Ownership change

The semantic derivation implementation was moved out of `compiler/scanner/subscanners/semantic` into `compiler/semantic/type-derivation`. The scanner's `SemanticTypeDeriver` remains a compatibility facade and delegates through `SemanticTypeDerivationRuntimeExecutorInterface` to `SemanticTypeDerivationAuthorityInterface` declared in `types/upstream`.

## Contract

- `SemanticTypeDerivationRequest` carries typed `ResourceAst`, `ModelAst`, `RouteSemanticFlow`, and the minimal type-interning capability.
- `SemanticTypeDerivationJudgment` reports result types, source coverage, derivation identity, authority identity, and closed status.
- The executor delegates only. The authority invokes the existing resource, route-response, and model derivation algebra.
- The concrete compiler `TypeInterner` is not imported into the upstream contract; only its structural capability is exposed.

## Scope boundary

This phase migrates semantic type derivation only. `RequestTypeDeriver` and its `request-deriver` implementation remain a known scanner-owned reasoning frontier and must be audited/migrated separately. AST construction/classification stays in scanner where it is syntax parsing; domain inference must not be added there.

## Validation

The Phase 1552 static audit passes 10/10 checks and covers all 455 current scanner TS/TSX files. A targeted TypeScript check is **not clean**: it reports type mismatches in the moved `route-response` derivation modules and unrelated domain/upstream modules. The full build cannot start because `tsdown` is not installed in the workspace; Vitest is unavailable for the same missing-dependencies reason. Do not treat static audit success as a passing build or runtime test.
