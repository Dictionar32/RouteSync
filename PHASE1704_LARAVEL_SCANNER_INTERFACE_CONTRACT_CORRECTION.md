# Phase 1704 — Laravel Scanner Interface Contract Correction

## Scope

This phase is deliberately interface-first. It corrects contract ownership and candidate/evidence correlation based on the actual scanner and invocation-analysis call graph. It does not migrate production wiring.

## Trace findings

1. `LaravelControllerScannerInterface` had been given `InvocationSemanticPipelineInterface` and returned `InvocationSemanticAnalysis[]`, but `ControllerScanner.scanCanonicalBundle` does not accept or execute that pipeline. Invocation semantic analysis is actually invoked by `controllerDataflowAnalyzer` through `invocationSemanticPipeline.analyzeKnowledge(...)`. Keeping invocation execution on the controller scanner contract would falsely assign ownership and force a future adapter to fabricate or duplicate analyses.
2. Route binding outcomes previously represented candidates and evidence as separate arrays. The arrays could drift: an evidence item could refer to a different route/candidate than the candidate at the same position. `RouteControllerBindingCandidate` now pairs one action with its route-side evidence; resolved and ambiguous outcomes use that paired type.
3. Resource model contract now states the intended policy explicitly: apply declared source precedence, then preserve distinct model ties as ambiguous. Existing `resourceModelReasoning.ts` still uses first-match selection and does not produce ambiguity. This remains an open semantic-authority gap; the interface contract must not hide it.
4. `laravelSourceAstPipeline.ts` still invokes concrete scanner classes directly. Wiring has intentionally not changed in this interface correction phase.

## Changes

- Removed invocation pipeline and invocation-analysis output from `LaravelControllerScannerInterface`.
- Kept invocation semantic authority at the dedicated controller dataflow boundary.
- Correlated each route controller candidate with its own evidence in the judgment ADT.
- Made resource candidate precedence/tie policy explicit in the semantic judgment contract.
- Added `audit:phase1704-laravel-scanner-interface-contract-correction`.

## Verification

The Phase 1704 audit verifies the corrected interface shape and reports known migration gaps separately. It is not a claim that wiring or authority implementation is complete.

Full TypeScript build/typecheck was not claimed for this phase; the preceding environment lacked `tsdown`.

## Next interface-first gate

Before production wiring, validate the exact source evidence and canonical identities required by route-controller and resource-model judgments. Then update the semantic authority to implement the interface's ambiguity contract. Only after those contracts are implemented and typechecked should `laravelSourceAstPipeline` be migrated to the scanner interfaces.
