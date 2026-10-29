# Phase 2755 — Upstream ADT Runtime Operations

## Runtime contract

The upstream route/CLI manifest runtime now exposes typed operation objects at the audited runtime boundaries. Exported free functions and exported arrow/function-expression values were removed from the selected runtime roots and replaced by named interface-typed operation objects.

## Applied operations

- `routeResourceMiddlewareOperations`: canonical middleware reference parsing and resource declaration/exclusion projection.
- `routeMiddlewareSemanticInputOperations`: canonical aggregation of route, group, resource, and controller middleware evidence.
- `effectiveControllerActionPolicyOperations`: runtime closure for a concrete controller/action policy.
- `effectiveControllerActionPolicyUpstreamOperations`: upstream policy ADT closure used by the canonical semantic authority.
- `routeSyncManifestDataflowProjection`: typed projection from closed upstream manifest flow to runtime-facing dataflow surface.
- `routeSyncManifestDataflowAnalysisOperations`: runtime analysis and policy application over upstream-closed judgments.
- `routeSyncManifestLoweringOperations`: lowering of a completed upstream manifest to the downstream `RouteManifest` contract.
- `manifestDriftAuditOperations` and `semanticCoverageAuditOperations`: CLI audit operations.
- `phpDiscoveryTemplateOperations` and `annotationWriterOperations`: remaining exported function declarations in the selected CLI command roots converted to interface-first objects.

## ADT invariants

`ManifestBuilderJudgment` remains a closed union of complete and blocked outcomes. AST projection blockers and source-model blockers retain distinct `kind` discriminators and their evidence. CLI manifest publication is only valid for the complete arm; blocked outcomes must not be converted into an empty successful manifest.

## Trace

CLI `scan` / `sync` → typed upstream composition → controller invocation inventory closure → prepared manifest builder → source AST projection → complete source model → typed manifest lowering/projection → `RouteSyncManifest` → CLI consumer.

CLI drift audit follows its direct path: `manifestDriftAuditOperations.audit` → `controllerInvocationManifestBuilder.build` → discriminated blocked/complete judgment → drift comparison only for the complete manifest.

Middleware-specific path: route/resource/controller evidence → `routeMiddlewareSemanticInputOperations` → `effectiveControllerActionPolicyOperations` → upstream closed policy ADT → downstream dataflow/runtime consumers.

## Audit

Run:

```bash
npm run audit:phase2755-upstream-adt-runtime-operations
```

The audit uses the TypeScript Compiler API to parse the selected runtime roots, rejects exported function-shaped declarations, and checks typed operation objects and ADT discriminators.

## Verification boundary

This is a static AST/source audit. Dependencies are not installed in this workspace, so full semantic typecheck, unit tests, package build, and CLI end-to-end execution have not been claimed. The known transitive `semantic/relations` CLI reachability and independent 34-law verifier remain separate tasks.
