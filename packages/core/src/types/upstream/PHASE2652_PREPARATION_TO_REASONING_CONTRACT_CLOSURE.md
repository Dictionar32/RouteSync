# RouteSync Phase 2652 — Upstream Preparation-to-Reasoning Contract Closure

Date: 2026-10-21

## Root cause

The upstream model already declared `RequestTypeDerivationSemanticInputPreparationInterface` and the compiler already implemented `prepareRequestTypeDerivationSemanticInput`. However, the semantic pipeline composition did not require that operation, and `RequestTypeDerivationSemanticReasoningInterface.infer` accepted raw `RequestTypeDerivationInput`. The preparation ledger could therefore exist beside the semantic pipeline without being a required input to reasoning.

## Contract evolution

- Evolved the existing `RequestTypeDerivationSemanticInputPreparation` into a generic source-correlated packet, preserving the exact raw input in `input`.
- Evolved the existing `RequestTypeDerivationSemanticInferenceFor` packet to retain both `input` and its matching `preparedInput`.
- Changed the existing `RequestTypeDerivationSemanticReasoningInterface.infer` boundary to accept `TInference['preparedInput']`, not raw arrays.
- Made the existing `RequestTypeDerivationSemanticInputPreparationInterface<TInference['input']>` mandatory in `RequestTypeDerivationSemanticPipelineCompositionInterface`.
- Wired the existing preparation operation into the existing assembler before reasoning. Raw input remains available to verification/authority integrity checks through the inference packet and pipeline boundary.
- Extended existing upstream type tests to assert preparation-to-reasoning correlation.

## Resulting path

`raw source input → existing canonical preparation operation → prepared inventory/resolution packet → semantic reasoning producer → proof verifier → decision → authority/integrity → manifest projection`

The assembler does not invent judgments or reinterpret preparation results. This closes the contract-level bypass where the existing preparation operation was optional to reasoning.

## Verification

- TypeScript parser syntax checks: 5/5 changed TypeScript files parsed successfully.
- Full `tsc --noEmit -p tsconfig.json`: blocked by the extracted workspace's missing dependency/type installation and compiler mismatch (`@types/node`, `vitest/globals`, standard library targets including the repository's configured target are unavailable to the globally installed compiler).
- Vitest, package build, and Laravel-to-manifest integration tests were not run because dependencies are not installed.

## Remaining work

This phase does not claim the RequestType semantic producer or independent verifier for all 34 canonical laws is implemented. The contract now forces the existing preparation operation into the reasoning path, but a real producer and complete verifier must still be supplied and tested. No legacy `RequestType[]` result is converted into a proof, and no dependency on `semantic/foundation` or `semantic/relations` is introduced.
