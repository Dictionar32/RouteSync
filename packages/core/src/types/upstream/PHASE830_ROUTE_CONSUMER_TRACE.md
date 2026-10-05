# Phase 830 — Route Consumer Truth Trace

## Correction

Phase 829 audit had an incorrect TypeScript extension matcher (`/\\.(ts|tsx)$/`), so its production consumer list was falsely empty. Phase 830 corrects the matcher to `/\.(ts|tsx)$/` and reruns the audit over all package production sources.

## Verified

- `RouteBoundaryAdapter` references: 0.
- Preserved legacy route factory files: present and empty.
- Core canonical construction remains `RouteEmission → RouteBoundaryContractFactory → RouteProducerInput → routeProducer → RouteAst`.
- Actual production references to `RouteSemanticFlowFactory` remain in the CLI incremental bridge and in the legacy core implementation itself.
- `RouteSemanticFlowLegacy` and the `RouteSemanticFlow` union remain in the CLI incremental layer.

## Actual frontier

```text
CLI incremental bridge
  scannedRouteDescriptor
  scannedManifestDescriptor
  incrementalTypes
  incremental.ts
  cli index exports
        ↓
  canonical RouteAst / manifest authority
```

Do not delete these legacy files yet. First drive external reachability to zero; then preserve the paths and empty the implementations.

## SDK

31 SDK test files still reference the core `RouteSemanticFlowFactory`. They are not mass-replaced in this phase. They must be classified into canonical semantic tests, scanner/integration tests, and factory-specific legacy SSOT tests.

## Next action

Trace the CLI incremental bridge first. It is a production dependency and therefore has priority over SDK-only test cleanup. No new semantic model or compatibility adapter should be introduced.
