# RouteSync Phase2382 — Canonical Route Contract Reuse

## Decision

Phase2381 introduced `LaravelRouteDeclarationOperationAuthority` despite the repository already having the canonical narrow contracts for method judgment, authorization judgment, resource flow, path resolution, and AST production. This created an additional operation boundary without closing the actual producer-boundary gap. Phase2382 removes that duplicate and restores direct dependency injection of the existing contracts.

## Code changes

- Removed `packages/core/src/types/upstream/routeDeclarationOperationAuthority.ts` and its barrel export.
- Restored `LaravelRouteScannerInterface` contract version 28 with the existing injected `declarationMethodAuthority`, `authorizationAuthority`, `routeResourceFlowAuthority`, `routePathResolutionAuthority`, `effectiveControllerActionPolicyExecutor`, and `routeProducer`.
- Rewired `createLaravelRouteScanner` to pass the declared authorities through its own injected dependencies.
- Kept the evidence-first improvement: one `RouteDeclarationEvidence` value is constructed per declaration and used by method judgment, resource resolution, path resolution, middleware authorization, and closure return emission.
- Removed active source references to the duplicate operation authority.
- Updated phase audit scripts so they validate the canonical contracts currently in use rather than importing the removed abstraction.

## Current active route flow

`RouteDeclarationAst → RouteDeclarationEvidence → Method Judgment + Authorization/Resource/Path Judgments → RouteEmission → RouteBoundaryContract → RouteProducerInput → RouteProducer → RouteAst → Scan Artifact → CLI`

## Validation

- `audit-phase2370-scanner-contract-first-resource-authority.cjs`: PASS 4/4
- `audit-phase2372-active-route-declaration-authority.cjs`: PASS for audit assertions; its generated report explicitly records `closureComplete: false`
- `audit-phase2374-route-path-authority-wiring.cjs`: PASS 6/6
- `audit-phase2379-route-declaration-evidence-closure.cjs`: PASS 6/6
- `audit-phase2381-route-evidence-authority-flow.cjs`: PASS 8/8
- `audit-phase2382-reuse-canonical-route-contracts.cjs`: PASS 14/14

A TypeScript check was attempted with the globally available compiler. It is not a valid full typecheck for this repository: the compiler rejects the repository's `ES2025` target/lib, and it reports two pre-existing syntax errors in `effectiveControllerActionPolicyResolver.phase921.test.ts`. After fixing a syntax issue in the edited scanner, the compiler no longer reports a syntax error in `laravelRouteScanner.ts`. No package build or end-to-end CLI regression was run; `node_modules` is absent.

## Remaining architectural blocker

This phase intentionally does **not** claim the route declaration chain is closed. The scanner still dispatches on method judgment and calls `subscanners/route-scanner` emitters. `RouteBoundaryContract` and `RouteProducerInput` are still built after `RouteEmission`. The next implementation must evolve the existing canonical `RouteBoundaryContract` / `RouteProducerInput` path so the producer-ready contract is available before emission, without adding another wrapper authority or moving `emitDeclaration` to another file.
