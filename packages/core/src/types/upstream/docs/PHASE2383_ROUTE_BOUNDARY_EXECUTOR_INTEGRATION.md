# Phase 2383 — Canonical Route Boundary Executor Integration

## Goal

Continue integrating the existing upstream contracts without adding another authority or ADT. The work targets the active `LaravelRouteScannerInterface` path and the datum flow from declaration evidence to `RouteProducer`.

## Root cause found

The active scanner retained `RouteEmission` in its `origins` collection, then converted it into `RouteBoundaryContract` later, immediately before `RouteProducerInput` construction. At the same time, `routeProducerInputFromRouteBoundary` reconstructed `RouteDeclarationEvidence` from `RouteDeclarationAst`, despite the scanner already having produced that evidence for method judgment and route emission. This created a second evidence projection and kept the intermediate emission as the main datum passed through the active scanner.

## Changes applied

1. `emitDeclaration` now returns the existing `RouteBoundaryContract` rather than `RouteEmission`.
2. Standard and resource emission results are projected immediately through the existing `routeBoundaryContractFromRouteEmission` conversion and the existing controller-action judgment correlation.
3. The active scanner's `origins` collection now stores `RouteBoundaryContract`, the original `RouteDeclarationEvidence`, the source declaration, and the existing method judgment. It no longer stores `RouteEmission`.
4. `routeProducerInputFromRouteBoundary` now receives the already-produced `RouteDeclarationEvidence`; it no longer reconstructs evidence from the AST.
5. `RouteProducer.produce` consumes `RouteProducerInput` derived from the canonical boundary and the same evidence datum.
6. Effective controller-action policy middleware input is projected from the same evidence datum rather than read back from a stored `RouteEmission`.
7. The artifact's authorization is taken from `RouteBoundaryContract.authorization`, preserving the judgment that crossed the canonical boundary.
8. The legacy `RouteScanner` call site was updated to supply the existing evidence contract explicitly; no new public interface was introduced.

## Active datum flow after this phase

`RouteDeclarationAst → RouteDeclarationEvidence → Method Judgment + Existing Resource/Path/Authorization Authorities → RouteBoundaryContract → RouteProducerInput → RouteProducer → RouteAst → RouteSemanticFlow/CLI projection`

The existing emitter still creates a temporary `RouteEmission` internally, and `routeBoundaryContractFromRouteEmission` remains the adapter from that emitter output. Thus this phase removes `RouteEmission` from the active scanner's stored/executor flow, but it does **not** claim that the `RouteEmission` ADT and emitter API have been fully retired. Fully removing it requires a further cutover of the emitter functions to construct the existing canonical boundary directly without an emission-shaped intermediate.

## Validation

- `audit-phase2383-route-boundary-executor-integration.cjs`: PASS 8/8.
- `audit-phase2382-reuse-canonical-route-contracts.cjs`: PASS 14/14.
- `audit-phase2375-invocation-operation-response-cli.cjs`: PASS 15/15.
- `audit-phase2374-route-path-authority-wiring.cjs`: PASS 6/6.
- `audit-phase2381-route-evidence-authority-flow.cjs`: PASS 8/8.
- `audit-phase2379-route-declaration-evidence-closure.cjs`: PASS 6/6 on the current source.

Historical structural scripts Phase2371, Phase2377, and Phase2380 include assertions tied to earlier scanner shapes and currently report failures against the evolved source. They have not been silently rewritten or counted as passing. Phase2372's report continues to say `closureComplete: false`; its `pass: true` only means its negative/incomplete-state assertions succeeded, not that the architecture is closed.

No full TypeScript typecheck, package build, or end-to-end CLI regression was run in this extracted ZIP workspace. The repository has no `node_modules`; `npm run build` was not run. Therefore this phase's success is limited to source-level structural checks, not runtime or compile validation.

## Remaining closure items

- Replace the temporary `RouteEmission` production inside the emitter itself with direct construction of the existing `RouteBoundaryContract`.
- Move method-family dispatch and target projection fully behind the existing upstream semantic judgments where they still occur in the active scanner.
- Verify operation contract, integrated response, runtime executor, and CLI end-to-end with available tests in the supported development environment.
- Re-run typecheck and regression tests after the full emitter cutover.
