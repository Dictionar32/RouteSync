# Phase 2242 — Action Derivation Ownership Closure

## Finding

Phase 2241 removed `scanControllerAction(...)` from the production action authority, but direct invocation of `resolveControllerActionContract(...)` did not transfer semantic ownership. The resolver still derives the return semantic, dataflow contract, dependency injection products, and invokes schema judgment while importing controller/resource subscanner helpers.

## Contract correction

The existing `LaravelControllerActionSemanticJudgmentContract` advances to version 36. Its partial-coverage ADT now includes `legacy_action_semantic_derivation`, with `resolveControllerActionContract` as current owner and `existing_upstream_semantic_judgment_contracts` as target. This does not create a new authority; it makes unresolved ownership explicit. Complete coverage remains structurally unavailable until all obligations are discharged.

## Production trace

`controllerInvocationManifestComposition` → invocation semantic pipeline/inventory → `LaravelControllerScanner` → action `judge(...)` → request evidence projection and request authority + body authority + `resolveControllerActionContract(...)` → published action judgment → action executor → `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse(...)` → AST/manifest projection.

## Remaining migration debt

- `resolveControllerActionContract(...)` still owns derivation and must not be called a projection-only function.
- `controllerReturnSemanticFromMethod(...)` remains in `subscanners/controller/controllerAstCanonical.ts`. The integrated response pipeline already consumes canonical `ControllerReturnSemantic`; however, it is a downstream projector and cannot replace the upstream return-semantic producer without creating a cycle.
- Dataflow, dependency injection, and schema derivation must each be traced to existing upstream contracts before wiring is changed. Do not create parallel authorities or move the same runtime logic into a new file and call it interface-first.
- No `relation` or `foundation` layer is introduced by this phase. This statement is scoped to the touched action contract and wiring; the resolver's imported subscanner dependencies remain open.

## Verification boundary

The focused audit verifies structural contract alignment and production trace assertions. It does not establish TypeScript compilation, unit-test success, or a successful package build.


Phase 2243 adds `ControllerReturnSemanticProductionInterface` as an upstream typed dependency. `resolveControllerActionContract` no longer imports or invokes `controllerReturnSemanticFromMethod` directly; production wiring injects the existing producer. This is an ownership-boundary improvement, not retirement of the legacy producer: the current adapter still calls `controllerAstCanonical`, and `legacy_action_semantic_derivation` remains open. The contract advances to version 37.
