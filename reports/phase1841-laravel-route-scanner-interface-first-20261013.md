# Phase 1841 — Laravel Route Scanner Interface-First

## Trace

The previous production pipeline called `RouteScanner.scanCanonicalBundle(sourceProject, relationSome(controllerBundle.controllerIndex))`. This route path depended on the legacy controller index and did not publish the already-available `LaravelControllerScanJudgment` with route binding outcomes.

## Changes

- Added `laravelRouteScanner`, implementing the existing `LaravelRouteScannerInterface`.
- The scanner receives `LaravelControllerScanJudgment` and an injected `RouteControllerBindingJudgmentAuthority`.
- Added `routeControllerBindingAuthority` to produce resolved, unresolved, and ambiguous route-controller binding judgments from canonical controller action contracts.
- Route AST, route semantic flow, and binding judgment are retained in each `LaravelRouteScanArtifact`.
- `SourceAsts.routeScan` retains the complete route judgment; legacy `RouteScanner.scanCanonicalBundle` is no longer called by the production pipeline.

## Scope disclosure

This phase does not retire all subscanners. `ControllerScanner` remains in the pipeline for the legacy resource scanner's controller index. The new route scanner still reuses lower-level route emission/producer modules under the old subscanner tree; the next migration must elevate those modules into their proper upstream owner before deleting the legacy directory. Build, typecheck, and end-to-end tests were not run.
