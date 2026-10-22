# Phase 2697 — Interface-Object Manifest Path

## Objective

Continue the interface-object migration on the live upstream CLI manifest path. Public runtime operations should be exposed as `export const name: Interface = Object.freeze({ ... })`; remove exported free-function entry points from the scoped route-group and manifest-projection path while preserving authority ownership and terminal judgments.

## Runtime trace

```text
CLI scan / sync
  → routeSyncCliManifestScanOperationFactory
  → routeSyncCliUpstreamCompositionFactory
  → controller invocation manifest composition authority
  → canonical source identity + closed controller source discovery
  → source-document reader + source-bound semantic delivery
  → validated inventory receipt
  → manifestBuilderOperationPreparation.prepare(...)
  → Laravel source AST pipeline
  → laravelAttributeScanner / laravelRouteScannerFactory
  → routeDeclarationEvidenceProjection
  → routeGroupContextResolver.fromFact(...)
  → routeGroupSemanticResolver.resolveContext(...)
  → routeManifestProjectionInputs (route/model/resource/request ASTs)
  → routeManifestRequestResolutionPreflight.evaluate(...)
  → routeManifestTypeLoweringAuthority
  → manifest build judgment
  → blocked judgment preserved OR complete manifest projected to flow
```

## Changes

- Replaced four free exported route/model/resource/request projection aliases with `routeManifestProjectionInputs: RouteManifestProjectionInputsInterface`.
- Replaced `controllerVariableSemanticEvidenceFromPhpAst(...)` with `controllerVariableSemanticEvidenceAdapter: ControllerVariableSemanticEvidenceAdapterInterface` and migrated its runtime caller to `.fromPhpAst(...)`.
- Replaced `migrationInterfaceFromAst(...)` with `migrationInterfaceAdapter: MigrationInterfaceAdapterInterface` and migrated source-AST pipeline mapping to `.fromAst(...)`.
- Replaced route-group exported resolver functions with `routeGroupSemanticResolver: RouteGroupSemanticResolverInterface` (`resolveJudgment`, `resolveContext`).
- Replaced AST-to-route-group exported bridge functions with `routeGroupContextResolver: RouteGroupContextResolverInterface` (`fromFact`, `fromDeclaration`).
- Updated compatibility exports, runtime call sites, and affected tests to use interface-object methods.
- Preserved the separation between CLI source discovery/composition and core semantic authority; no failure/blocked judgment is reclassified as success.

## Audit results

- Phase 2697 structural audit: **27/27 passed**.
- TypeScript transpile syntax checks: **12/12 passed** across changed implementation files.
- Phase 2696 baseline audit: **16/16 passed**.
- Full project typecheck, build, unit tests, and end-to-end CLI scan/sync integration: **not verified**. Syntax transpilation does not prove type compatibility or runtime correctness; the repository environment previously lacked project-pinned dependencies and compatible project type declarations.

## Follow-up

1. Run the repository-pinned TypeScript compiler and full test suite in a dependency-complete workspace.
2. Run CLI scan/sync integration cases for missing/unreadable roots, symbolic links, identity mismatch, valid empty inventory, and blocked semantic judgment.
3. Continue interface-object conversion only on confirmed live runtime paths; avoid a mechanical repository-wide conversion of unrelated generators or examples.
