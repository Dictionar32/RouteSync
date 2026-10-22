# Phase 1836 — Laravel Controller Downstream Interface First

## Trace finding

`LaravelControllerScannerInterface` already models a correlated controller AST, action-contract list, and invocation semantic judgment. However, `LaravelRouteScannerInterface` and `LaravelResourceScannerInterface` previously accepted a detached `ControllerActionFlowContract[]`. That weakened the handoff: consumers could receive actions detached from the controller scan judgment that carries source-correlated invocation integrated responses.

The concrete legacy consumers remain further behind: `RouteScanner` consumes a nested `RelationIndex` of `ControllerActionInfo`, and `ResourceScanner` consumes a scanner-local `ModelSymbolTable` plus `ControllerResourceDataflow`.

## Interface-first correction

- Advanced `LaravelControllerScannerInterface` contract version to 8 and boundary contract version to 44.
- Added an explicit downstream boundary: route/resource consumers must receive the complete correlated controller scan judgment rather than detached action arrays or legacy controller indexes.
- Advanced route/resource contracts to version 3.
- Changed both route and resource inputs to accept `LaravelControllerScanJudgment`.
- Preserved route binding authority and resource model-binding authority as explicit dependencies.
- Preserved correlated route AST/flow/binding and resource AST/definition/model-binding artifacts.
- No production wiring was changed in this interface-first phase.

## Static audit

Run `npm run audit:phase1836-laravel-controller-downstream-interface-first`.

This phase deliberately does not claim the legacy scanner is retired. The next phase must implement these contracts and migrate `laravelSourceAstPipeline.ts` plus route/resource consumers to use them. Until then, the audit reports the remaining legacy calls explicitly.

Build, typecheck, and E2E are not run in this phase.
