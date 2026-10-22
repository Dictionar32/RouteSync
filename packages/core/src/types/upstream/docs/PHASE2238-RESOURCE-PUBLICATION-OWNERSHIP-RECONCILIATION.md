# Phase 2238 — Reconcile action-authority ownership obligations

## Root cause

Phase 2237 reintroduced `resource_binding_aggregation` as an outstanding action-authority obligation even though the existing `ControllerResourceBindingAuthorityInterface` already owns both the closed resource judgment and `publishResolved`. The production wiring calls `controllerResourceBindingAuthority.publishResolved(...)` for each resolved binding. Keeping this as open debt misstates the architecture and would encourage a duplicate authority.

## Interface-first correction

- Evolved the existing `LaravelControllerActionSemanticJudgmentContract` from version 32 to 33.
- Removed the false `resource_binding_aggregation` obligation; resource judgment and canonical publication remain owned by the existing resource authority.
- Corrected request-binding compatibility debt: the existing request authority owns the closed request judgment, while building its typed evidence from PHP AST remains a source-evidence projection responsibility. The obligation now points to `source_evidence_projection_boundary`, not back to the semantic authority.
- Updated the existing action coverage regression test and structural audits. No new semantic authority or generic equality abstraction was added.

## CLI trace and remaining blockers

`packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` composes the invocation pipeline and inventory authority. The production controller wiring still calls `scanControllerAction`, which calls `resolveControllerActionContract`; the existing body authority is invoked before that legacy action projection. Integrated response remains owned by `LaravelControllerResponseSemanticPipelineInterface`.

The route is therefore **not yet fully interface-first**. Remaining obligations are body-source-AST projection and request-binding evidence projection. The resource-binding publication path is not an outstanding obligation.

## Validation boundary

The phase audits are structural. They do not claim a TypeScript typecheck, Vitest run, or package build.
