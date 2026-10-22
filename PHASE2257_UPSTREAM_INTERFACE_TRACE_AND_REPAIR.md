# Phase 2257 — Upstream Interface Trace and Projection Injection Repair

## Scope

This phase continues from the Phase2256 ZIP snapshot. It repairs a production wiring defect rather than adding a contract inventory only.

## Trace

`LaravelControllerActionSemanticJudgmentAuthorityInterface.judge(...)`
→ `createActionJudgmentAuthority(...)`
→ `resolveControllerActionContract(...)`
→ `ControllerResourceReturnSourceEvidenceProjectionInterface.project(...)`
→ `ControllerResourceBindingAuthorityInterface.judge(...)`
→ canonical resource-binding publication.

## Root cause found

`LaravelControllerExecutionDependencies` already declared `resourceReturnSourceEvidenceProjection`, and the default dependency object already carried the parser adapter. However, `createActionJudgmentAuthority` did not accept that dependency. The action judgment closure bypassed the declared dependency and hardcoded `controllerResourceReturnSourceEvidenceProjection` when constructing the resolver context.

That meant the contract suggested dependency injection, but the production composition did not honor it. Alternative implementations could not be wired through the upstream boundary.

## Repair

- Added `resourceReturnSourceEvidenceProjection` to `createActionJudgmentAuthority` inputs, typed from `LaravelControllerExecutionDependencies`.
- Passed the selected projection into `resolveControllerActionContract` through the resolver context.
- Passed the existing parser adapter into the factory at the composition root.
- Added `scripts/audits/test-phase2257-upstream-projection-injection-authority.cjs` to check the declared type, composition, and absence of concrete adapter selection inside the authority factory.

## Validation

- Phase2257 focused static audit: 7/7 assertions passed.
- Phase2255 action-judgment contract closure audit: 27/27 assertions passed.
- No build, typecheck, or Vitest run is claimed.

## Remaining upstream ownership debt

This change closes only the projection injection defect. It does not retire `resolveControllerActionContract`, `controllerAstCanonical`, or the remaining `subscanners` imports. Return semantic production still delegates to `controllerAstCanonical`; action contract construction still derives response-reference, resource-binding aggregation, schema composition, and runtime return; transitive `semantic/relations` use remains in the dataflow knowledge/collection path. These are next-stage ownership migrations, not solved by renaming or relocating files.

## Next recommended interface-first step

Evolve the existing `LaravelControllerActionSemanticJudgmentAuthorityInterface` inputs to consume complete upstream judgments for request, body, dependencies, return, dataflow, schema, and resource outcomes. Then make the action authority a composition/publisher of those judgments, with AST evidence projection kept on the parser boundary. Do not introduce a second action authority or add `semantic/foundation` / `semantic/relations` dependencies.
