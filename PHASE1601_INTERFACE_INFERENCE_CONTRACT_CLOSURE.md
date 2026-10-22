# Phase 1601 — Interface-first inference contract closure

## Scope

Only the upstream RequestType derivation interface surface and its type-contract test were changed. No scanner wiring, producer implementation, verifier implementation, or runtime executor was changed.

## Contract gap closed

Previously, the reasoning interface declared a generic `contract: TContract`, but `infer()` returned a bare `RequestTypeDerivationJudgment`. The verifier then accepted loose `(input, judgment)` arguments. The type boundary therefore did not carry the invocation input, judgment, and contract as one unit; the generic contract association was lost at the returned-value boundary and the verifier could be passed a judgment detached from the inference invocation.

## Change

- Added `RequestTypeDerivationSemanticInferenceFor<TContract>` with `contract`, `input`, and `judgment` as one readonly packet.
- Changed `RequestTypeDerivationSemanticReasoningInterface.infer()` to return that packet.
- Changed `RequestTypeDerivationProofVerificationInterface.verify()` to accept the packet rather than independent input/judgment arguments.
- Changed `RequestTypeDerivationSemanticDecisionPremises<TContract>` to consume the packet, keeping the source input and judgment paired through decision construction.
- Added `requestTypeDerivationInferenceContract.phase1601.test.ts` to assert the type relationships.

## Boundary rules preserved

- `RequestTypeDerivationSemanticPipelineInterface` remains the consumer-facing API.
- No scanner/runtime wiring was changed.
- Type-level contract binding does not prove runtime object-value equality. The assembler/authority implementation must still compare actual contract values before exposing a pipeline.

## Verification status

The source-level interface audit confirms the new packet is referenced by reasoning, verification, and decision premises, and that the legacy loose verifier signature is absent from this interface. Type tests and package build must be run in an environment with the repository-pinned TypeScript/Vitest/tsdown dependencies; this artifact does not claim those commands passed.
