# Phase 542 — Scanner/Resolver Relational Cutover

## Scope

Closed four active scanner/resolver surfaces:

- `packages/core/src/compiler/scanner/subscanners/semantic/resourceTypeDeriver.ts`
- `packages/core/src/compiler/scanner/subscanners/semantic/route-response/shapeExtractor.ts`
- `packages/core/src/compiler/scanner/subscanners/semantic/routeResponseDeriver.ts`
- `packages/core/src/compiler/scanner/subscanners/resource/resourceSemanticMappingRelations.ts`

## Architecture

The cutover follows:

`scanner evidence -> semantic relations -> candidate/option witnesses -> recursive closure/fold -> canonical semantic projection`

### Resource type derivation

- Resource collections use relation projection rather than array mapping.
- Sequence traversal is recursive and relation-gated.
- Nested object property expansion is relation-folded recursively.
- Resource base-name normalization is relation-gated.
- Property-name construction uses relation text slicing.

### Response shape

- Response absence is represented as `RelationOption<RouteResponseShape>`.
- Void/inline/wrapped response alternatives are relation-gated.
- Resource/model wrapper selection and cardinality are relation relations.
- The response consumer folds the option into canonical ObjectType construction.

### Resource semantic mapping

- Mapping rule tables are constructed through relation projection.
- Semantic fact selection uses relation lookup/option folding rather than array search/nullish fallback.
- Constructor resolution uses relation lookup/option folding.
- The mapping registry remains a derived constructor index; the semantic relation solver remains authoritative.

## Audit

`node scripts/audit-phase542-scanner-resolver-relational-frontier.cjs`

All four targets:

- `if`: 0
- `for`: 0
- `while`: 0
- `switch`: 0
- `map`: 0
- `filter`: 0
- `reduce`: 0
- `flatMap`: 0
- `undefined`: 0
- `??`: 0
- `null`: 0
- `===`: 0
- `as unknown`: 0
- `||`: 0
- `&&`: 0
- `trim`: 0
- `slice`: 0
- `never`: 0
- `index+123`: 0
- ternary: 0
- `transpileModule` diagnostics: 0

Regression audits for Phases 540 and 541 also pass.

Repository-wide `tsc` remains environment-limited by the existing missing `node` and `vitest/globals` type definitions; no target-specific transpilation diagnostics were observed.
