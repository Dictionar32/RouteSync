# Phase 1626 — Interface-first assessment integrity authority

## Trace and finding

The request-type semantic boundary is declared in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts`:

- `RequestTypeDerivationSemanticReasoningInterface` owns source-evidence inference into a closed inference packet.
- `RequestTypeDerivationProofVerificationInterface` checks the produced packet.
- `RequestTypeDerivationSemanticDecisionInterface` correlates the packet, verification, and coverage into a closed decision proof.
- `RequestTypeDerivationSemanticPipelineInterface` is the scanner-facing source-bound boundary.
- `RequestTypeDerivationRuntimeExecutorInterface` consumes the pipeline result and projects only the `derived` judgment.

Before this phase, `requestTypeDerivationRuntimeExecutor.ts` contained its own `assessmentIntegrityFailure` decision-rule switch. That meant the executor repeated semantic proof/judgment/verification/coverage coherence checks even though the upstream authority had already produced a closed assessment. Separately, `RequestTypeDerivationSemanticAuthorityIntegrityInterface` validates correlation among candidate, inference, and verification witnesses; it is useful but is not the same operation as checking the final assessment envelope.

## Change

1. Extended the existing canonical `RequestTypeDerivationSemanticPipelineInterface` with `validateAssessment`, rather than introducing another competing pipeline interface.
2. Added a closed `RequestTypeDerivationSemanticAssessmentIntegrityResult` and finite failure vocabulary to the upstream type contract.
3. Moved the proof-rule/judgment/verification/coverage coherence checker into `requestTypeDerivationAssessmentIntegrityRuntime.ts` under `types/upstream` and added a helper to bind it to the pipeline's contract value.
4. Changed the runtime executor to call `pipeline.validateAssessment(assessment)`; it no longer owns the semantic rule switch.
5. Kept `isAssessmentEnvelope` as a defensive structural guard for values crossing runtime/plugin/package boundaries, and kept source-input binding in the executor. These are boundary-integrity checks, not semantic inference.

## Flow after the change

`source evidence → semantic reasoning → closed judgment/proof → pipeline.derive + pipeline.validateAssessment → runtime executor → judgment-only projection`

The scanner authority entry points `routeManifestTypeLoweringAuthority.ts` and `routeManifestProjectionAuthority.ts` consume `RequestTypeDerivationSemanticPipelineInterface`; they remain downstream consumers and should not implement semantic validation themselves.

## Verification

- `audit:phase1626-interface-first-assessment-integrity-authority`: 8/8 checks passed.
- `audit:phase1624-interface-first-judgment-variant-preservation`: 5/5 checks passed.
- Full TypeScript build and Vitest were not run: the workspace has no root `node_modules` (including `@types/node` and Vitest), and the globally available TypeScript 5.8.3 is older than this repository’s configured TypeScript 7.0.2 and rejects its target/lib settings before checking project sources. The interface change deliberately makes assessment validation a required pipeline capability, so any external pipeline construction site must wire `createRequestTypeDerivationSemanticAssessmentValidator(contract)` into `validateAssessment` before it satisfies the updated contract.
