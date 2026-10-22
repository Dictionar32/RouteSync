# Phase 2237 — Action Authority Ownership Obligations Restored

## Why

The production action judgment still calls `scanControllerAction(...)`, which calls `resolveControllerActionContract(...)`. Yet the published action coverage had `derivationOwnershipRemainder: []`, and the closure text claimed body derivation debt was empty. That contract was not truthful: interface usage alone does not mean semantic ownership has migrated.

## Change

Evolved the existing `LaravelControllerActionSemanticJudgmentContract` from version 31 to 32. No parallel authority was introduced.

The existing coverage ADT now explicitly records three open obligations:

- `body_source_ast`: raw body AST remains in the action contract projection; target is the source-evidence projection boundary.
- `resource_binding_aggregation`: canonical resource-binding publication is upstream-owned, but aggregation still traverses the legacy action adapter; target is the existing `ControllerResourceBindingAuthority`.
- `request_binding_compatibility_adapter`: request evidence adaptation still traverses the legacy action adapter; target is the existing `LaravelControllerRequestSemanticBindingAuthority`.

The exact integrated response pipeline remains `LaravelControllerResponseSemanticPipelineInterface`. The response descriptor obligation remains retired; it was not reintroduced.

## CLI trace

`packages/cli/src/commands/scan.ts` and `sync.ts` call `buildManifestWithInvocationPipeline(...)`. That composition uses the core invocation semantic pipeline and manifest inventory authority. Downstream, `LaravelControllerScannerExecutor` calls the configured action judgment authority, then the existing integrated response pipeline and AST projection authority.

The action authority implementation in `laravelControllerExecutionDependencies.ts` still imports and calls `scanControllerAction(...)` and `controllerBodySemanticJudgmentAuthority`. Therefore the CLI is **not fully interface-first yet**. The new typed obligations make that debt machine-visible rather than falsely declaring it closed.

## Boundaries

- No `semantic/foundation` dependency was added.
- No generic equality authority was added.
- No new parallel invocation or response authority was added.
- No subscanner was removed or merely moved to another file.
- This phase does not claim subscanner retirement.
- Full build/typecheck/Vitest were not run; structural audit only.
