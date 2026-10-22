# Phase 1360 — Semantic Boundary Ownership Trace

## Objective

Trace the remaining upstream semantic-boundary candidates through producer, contract, authority/algebra, wiring, and consumer. This phase prioritizes evidence-backed ownership over adding consumers just to reduce an unused-symbol count.

## Findings and decisions

### `ControllerExpressionFact`

The contract is currently declaration-only in the core TypeScript source. Its expression/origin/source fields overlap with evidence already represented in controller expression canonicalization and `ControllerSemanticDataflow` (`variables`, `resources`, `returned`, and canonical `dataflow`). No producer-consumer path was found for this exact type. Preserve it; do not invent a new dataflow conversion until a real missing consumer is identified.

### `ExpressionDefinition`

This is a declaration-only `{ expression, source }` pair, while every canonical `Expression` variant already carries `source`. Preserve the type as a possible public vocabulary contract, but do not add wrappers that duplicate source provenance without a consumer requirement.

### `ValidationRuleDefinition`

The active scanner/form-request pipeline uses domain `ValidationRuleNode`, `ValidationRuleParser`, form-request descriptors, and rule collectors. `ValidationRuleDefinition` is not currently the source contract for that path. This is a real parallel-vocabulary/migration seam, not a reason to add an adapter that reclassifies rules. Any future unification must nominate one canonical semantic owner and preserve source/provenance and unsupported-rule behavior end-to-end before Zod projection.

### `SchemaRelationTarget`

The active model semantic builder consumes `schemaRelationIndexFrom(SchemaInterface)` and `SchemaRelationIndexInterface` / `SchemaRelationInterface`. The simple table/model tuple is declaration-only and would be redundant if wired without a distinct consumer requirement. Preserve it pending a concrete need.

### `RouteConstraintFlow`

No active producer/consumer was found for this contract. The active route scanner uses `RouteDeclarationAst` and `routeDataFlow.ts` constraint facts/provenance. Preserve the old contract file in place; do not delete or empty it automatically. A migration would require comparing effective constraint merge and provenance semantics first.

### `ApiResourceAction`

The narrower alias is declaration-only; resource routing already has a `RouteResourceActionPlan` and canonical resource action knowledge. Do not add a fake reference to it. Preserve it until a public consumer requires the narrower API-resource action vocabulary.

## Canonical pipeline boundaries

```text
Laravel source
  -> CompleteSourceAst validation
  -> CompleteLaravelSourceModel
  -> manifest + semantic dataflow seeds
  -> DataFlow authority / read-only consumer contract
  -> IR projection

SchemaInterface
  -> schemaRelationIndexFrom
  -> SchemaRelationIndexInterface
  -> model semantic relation construction

RouteDeclarationAst
  -> routeDataFlow facts + provenance
  -> route semantic authority
  -> manifest / target projection

StructuralSemanticRelation
  -> GraphEdgeRelation projection
  -> graph consumers

Operation identity / capability
  -> CLI projection
  -> SDK contract
  -> React hooks / target frontend
```

AST nodes, dataflow nodes, structural graph edges, and target runtime data are distinct representations. Wiring should preserve identity/provenance and pass canonical results; it should not run another Laravel classifier.

## TypeScript 7 toolchain caveat

The repository declares TypeScript `7.0.2`, but the available environment has global TypeScript `5.8.3`, no local `node_modules`, and no `tsdown` executable. TypeScript's official 7.0 announcement says 7.0 does not ship a programmatic compiler API; programmatic symbol audits should use the appropriate compatibility API package/version. Therefore the audit is a static contract trace and does not claim a TypeScript 7 full build.

## Audit

Run:

```sh
npm run audit:phase1360-semantic-boundary-ownership
```

Report:

`scripts/audits/reports/phase1360-semantic-boundary-ownership.json`

The audit asserts the current source-level ownership paths and expected declaration-only findings. It does not treat unreferenced declarations as proof of dead public API.

## External design references

- TypeScript 7.0 announcement and compatibility API note: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- CodeQL JavaScript/TypeScript dataflow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- MLIR interfaces: https://mlir.llvm.org/docs/Interfaces/
- Laravel validation API: https://api.laravel.com/docs/12.x/Illuminate/Validation.html
- Zod parsing and validation: https://zod.dev/basics
- Axios instances: https://axios-http.com/docs/instance
- TanStack Query query keys: https://tanstack.com/query/latest/docs/framework/query-keys
- Next.js data fetching: https://nextjs.org/docs/app/getting-started/fetching-data

These sources support the architectural boundary, not claims that the repository has been built or runtime-tested.
