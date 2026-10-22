# Phase 2374 — Route path authority wiring

## Audit → trace → authority → root cause

Phase 2372/2373 established that the active scanner directly called `resolveRoutePath` for standard and query routes. This allowed the scanner orchestration path to select path normalization and resource identity before emission, while `LaravelRouteScannerInterface` did not declare the operation.

## Contract evolution and integration performed

- Added the closed upstream `LaravelRoutePathResolutionAuthority` operation and `ResolvedLaravelRoutePath` result contract.
- Added the operation to `LaravelRouteScannerInterface` and its active scanner factory wiring.
- Standard and query route branches now invoke the injected operation; the active scanner no longer imports or directly calls `resolveRoutePath`.
- Added a static audit for the contract and wiring boundary.

## Explicitly unresolved; do not treat this phase as full architectural completion

The authority implementation still imports `RouteParameterSemanticFactory` from the compiler scanner layer. That factory transitively uses `semantic/relations`, so the no-relations requirement is **not** satisfied transitively. The active scanner still imports `semantic/relations`, derives declaration flow/controller/action locally, and invokes emitter operations from `subscanners/route-scanner`. `RouteEmission` and the post-emission `RouteBoundaryContract` projection remain downstream of semantic emission. This phase only closes the missing path-resolution injection point; it does not close the complete declaration judgment or the end-to-end interface-first route flow.

## Validation

Run `node scripts/audits/audit-phase2374-route-path-authority-wiring.cjs`. The audit reports 7/8 checks: it intentionally fails the compiler-owned parameter-factory check until that semantic ownership is migrated to a proper upstream owner. No `npm run build` was run.
