# Phase 2268 — Controller Dependency Evidence Ownership

## Trace

The CLI production route reaches `laravelControllerExecutionDependencies.ts`, where the existing controller action judgment authority composes upstream judgments and passes closed products into `LaravelControllerActionContractResolverInterface`.

Before this phase, `controllerActionContract.ts` combined two different responsibilities: projection of a completed action contract and construction of source-specific dependency evidence from PHP controller parameter AST. That mixed ownership made the projection module import scanner subscanners even though its resolver itself was projection-only.

## Change

- Moved controller parameter → `ControllerDependencySemanticInput` construction into `wiring/controllerDependencyEvidenceProjection.ts`, the scanner-side source evidence boundary.
- Strengthened the existing upstream dependency contract with generic `ControllerDependencySourceEvidenceProjectionInterface<TSourceEvidence>`. It describes the boundary without importing PHP AST types.
- The source adapter emits typed evidence only. The action authority composition invokes the existing `ControllerDependencySemanticJudgmentAuthorityInterface` and projects its closed judgment; no second dependency authority was added.
- Updated production wiring and the existing resolver fixture to consume the source evidence projection.
- Removed dependency evidence helpers and their subscanner imports from `controllerActionContract.ts`.
- Preserved the exact upstream dataflow judgment projection added in Phase 2267.

## Remaining debt

This phase does **not** claim the dependency path is subscanner-free: the new source adapter still uses the existing `expressionProducer` and resource expression-sequence adapter to lower attribute argument syntax. The next correction should replace those imports through the already-existing PHP AST expression semantic authority / a proper source evidence interface, without moving semantic classification into the scanner and without adding a duplicate dependency authority.

`semantic/relations` remains a transitive dataflow vocabulary debt. No `semantic/foundation` dependency was added.

## Validation

Run `node scripts/audits/audit-phase2266-action-resolver-projection-only.cjs` and `node scripts/audits/audit-phase2268-dependency-evidence-ownership.cjs`. These are static boundary audits, not a substitute for TypeScript compilation or Vitest.
