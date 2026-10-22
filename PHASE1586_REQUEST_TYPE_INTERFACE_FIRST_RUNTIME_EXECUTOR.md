# Phase 1586 — RequestType Interface-First Runtime Executor

## Trace finding

Phase 1585 routed scanner lowering through `RequestTypeDerivationProjectionInterface`, but that interface returned only `RequestType[]`. The canonical upstream model already declared a closed judgment, proof verification, authority assessment, semantic pipeline, and judgment-consumer interface; no concrete pipeline composed those contracts into the scanner path. Therefore, the existence of the types did not establish an end-to-end authority boundary.

## Change in this phase

Added `requestTypeDerivationRuntimeExecutor.ts`. It accepts the upstream `RequestTypeDerivationSemanticPipelineInterface` and a `RequestTypeDerivationJudgmentConsumerInterface`, then projects only the judgment embedded in `derivation_verified`. It preserves incomplete, conflict, rejected-input, verification-failure, rejection-verification-failure, and inconsistent-authority results as distinct outcomes. The executor does not import the route/request/resource solver and does not infer semantic classifications.

## Remaining blocking cutover

`routeManifestTypeLowering.ts` still calls the legacy projection pipeline because the repository does not yet provide a concrete implementation of `RequestTypeDerivationSemanticPipelineInterface` that builds and verifies the full proof model from source evidence. Wiring the executor to the legacy `RequestType[]` output and fabricating proof/closure would be unsound. This phase deliberately does not claim end-to-end cutover or build success.

## Required next step

Implement the source-relation reasoning producer and law verifier against the existing upstream `RequestTypeDerivationProof` model; then compose them into the semantic pipeline, add a judgment-to-artifact consumer, replace the legacy lowering call, and test proof tampering, incomplete evidence, conflicts, and closure conservation. Only after that should the legacy projection solver be retired.
