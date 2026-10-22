# RouteSync Phase2421 — RequestType Semantic Pipeline Assembler

## Scope

Implement the existing `RequestTypeDerivationSemanticPipelineAssemblerInterface` as a semantic-layer composition operation. The implementation is exported from the core entry point so a real semantic composition root can assemble existing capabilities without duplicating the orchestration in scanner wiring.

## Changes

1. Added `createRequestTypeDerivationSemanticPipelineAssembler` under `compiler/semantic/request-type-derivation`.
2. It checks that reasoning, verifier, decision, and authority capabilities share the exact canonical contract instance before exposing a consumer pipeline.
3. It composes the existing operations in order: `reasoning.infer(input)` → `verifier.verify(inference)` → existing authority coverage operation → `decision.decide(premises)` → `authority.evaluate(input, candidate)`.
4. The resulting pipeline delegates `validateAssessment` to the existing upstream assessment integrity validator bound to the same contract.
5. Contract mismatch returns the existing closed `rejected` assembly result; no partial pipeline or legacy fallback is supplied.
6. No new semantic interface or ADT was introduced. The implementation does not import `semantic/relations` or `semantic/foundation` and does not derive or repair judgments.

## Root-cause boundary that remains open

This phase closes pipeline assembly, not the missing concrete semantic producer. The repository still has no production implementation of the `RequestTypeDerivationSemanticReasoningInterface`, `RequestTypeDerivationProofVerificationInterface`, `RequestTypeDerivationSemanticDecisionInterface`, and `RequestTypeDerivationSemanticAuthorityInterface` composition that produces proof-backed RequestType judgments from the active route/resource/request evidence.

The active `routeManifestTypeLowering.ts` still calls `requestTypeDerivationProjectionPipeline.derive(...)`. The authority-backed manifest projection still accepts an injected `RequestTypeDerivationSemanticPipelineInterface`, but no valid production composition can yet be supplied. It is intentionally not wired to a fake producer or to the legacy solver's `RequestType[]` output, because that would manufacture proof semantics that the solver does not emit.

## Validation limits

The Phase2421 structural audit verifies that the existing operation interfaces are composed in the declared order and that contract mismatch is fail-closed. TypeScript transpilation was checked separately. A targeted typecheck still surfaces existing diagnostics in other upstream files, including `requestTypeDerivationAssessmentIntegrityRuntime.ts`; no full project typecheck, Vitest, package build, or live CLI test is claimed.

## Technical reference

TypeScript's official handbook explains discriminated unions and exhaustiveness checking, supporting closed outcomes and explicit handling of every assembly/assessment variant: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
