# Phase 1607 — Interface Capability Inference Closure Audit

## Objective

Audit every request-type derivation upstream capability boundary that participates in semantic pipeline composition, after Phase 1606 identified inference preservation at the public `derive` boundary.

## Findings and changes

File: `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`

- `RequestTypeDerivationSemanticReasoningInterface<TContract, TInference>` now returns `TInference` from `infer`; its generic parameter is no longer nominally declared and then erased by the return type.
- `RequestTypeDerivationProofVerificationInterface<TContract, TInference>` now accepts that fixed `TInference` and returns `RequestTypeDerivationSemanticVerificationFor<TContract, TInference>`. The method no longer shadows the interface-level inference parameter with a separate generic that could widen the capability boundary.
- `RequestTypeDerivationSemanticDecisionInterface<TContract, TInference>` now consumes and returns the same fixed inference family rather than redeclaring a method-level generic.
- `RequestTypeDerivationSemanticAuthorityInterface` now carries `TInference` at the capability boundary; `evaluate` accepts a candidate and returns an assessment bound to that same inference family.
- `RequestTypeDerivationSemanticPipelineCompositionInterface` now threads the same `TInference` into reasoning, verifier, decision, and authority capabilities.
- `RequestTypeDerivationSemanticPipelineAssemblyResult` and `RequestTypeDerivationSemanticPipelineAssemblerInterface` preserve `TInference` through the assembled pipeline result rather than reverting to the default type.
- Added `requestTypeDerivationCapabilityInferenceClosure.phase1607.test.ts` to assert the type path across all those boundaries.

## Architectural boundary

This is an interface-contract change only. No scanner wiring, runtime executor, semantic producer implementation, or downstream projection was changed. The contract prevents accidental generic widening at these declared boundaries; it does not prove that an implementation preserves the exact object identity or validates runtime contract equality.

## Verification

- Static source audit and diff-scope check: performed during packaging.
- ZIP integrity and top-level `RouteSync/` entry: checked during packaging.
- TypeScript/Vitest/package build: not run because this workspace has no installed local TypeScript/Vitest/build binaries. This phase is not build-verified.
