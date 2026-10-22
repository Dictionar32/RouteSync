# Phase 1623 — Interface-First Input Shape Preservation

## Scope

This phase changes only `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` and adds a static audit script. Scanner implementation, wiring, semantic algebra implementation, and runtime executor are intentionally unchanged.

## Trace findings

- `RequestTypeDerivationSemanticPipelineInterface.derive` is the consumer-facing source-bound boundary.
- `RequestTypeDerivationSemanticReasoningInterface.infer` owns source-to-judgment inference.
- `RequestTypeDerivationProofVerificationInterface.verify` owns proof checking, not inference repair.
- `RequestTypeDerivationSemanticAuthorityInterface.evaluate` adjudicates a closed candidate against the invocation input.
- `RequestTypeDerivationSemanticAuthorityIntegrityInterface.validate` checks witness correlation at the value boundary.
- Scanner wiring consumers found in this trace: `routeManifestProjectionAuthority.ts` and `routeManifestTypeLoweringAuthority.ts`.
- Runtime executor: `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationRuntimeExecutor.ts`.

## Model improvement

`RequestTypeDerivationSemanticInferenceFor` now accepts a second generic parameter, `TInput`, defaulting to `RequestTypeDerivationInput`. The inference packet preserves that input type, and the reasoning, authority evaluation, integrity validation, and consumer pipeline contracts use `TInference['input']` rather than independently widening those signatures to the base input type.

This strengthens compile-time input-shape and judgment-variant correlation for specialized inference packets without claiming TypeScript can prove runtime object identity or proof validity. Exact invocation binding and contract equivalence remain runtime witness obligations. Existing default instantiations retain the original `RequestTypeDerivationInput` behavior.

## Architecture boundary

No scanner, wiring, runtime executor, or downstream projection code is modified. This is not a claim that the end-to-end wiring has been migrated; it is an upstream contract refinement only.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic compiler analyses and transformations query semantic interfaces rather than hardcoding per-operation knowledge.
- TypeScript Unions and Intersections: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html — discriminated unions encode coherent alternatives and support exhaustiveness checking.

## Validation

Run `node scripts/audits/audit-phase1623-interface-first-input-shape-preservation.cjs`. TypeScript/build validation must be reported separately; static contract audit does not establish a successful full build.
