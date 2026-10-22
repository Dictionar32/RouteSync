# Phase 1712 — Static Invocation Authority Validation Interface

## Scope

Interface-first refinement only. This phase defines a validation boundary for the static invocation aggregate judgment. It does not implement static invocation algebra, authority validation, runtime execution, or Laravel scanner wiring.

## Trace findings

- `SemanticStaticInvocation` exists as a distinct source fact in `semanticDataflowKnowledge.ts`.
- The static target, argument/effect, aggregate judgment, proof, and obligation contracts exist in `invocationSemanticPipelineInterface.ts`.
- The current ordinary invocation authority (`invocationSemanticJudgmentAuthority.ts`) validates ordinary invocation judgments; it does not validate the static aggregate ADT.
- Laravel controller scanner remains a source-artifact boundary and must not reconstruct proof or reconcile obligations.

## Changes

- Added `InvocationStaticSemanticAuthorityValidationInput`, `InvocationStaticSemanticAuthorityValidationInterface`, typed validation result, receipt, and violation ADT.
- Added a distinct `static_callable_effects_unavailable` obligation for the case where the target is uniquely resolved but no source-established effect contract exists. The judgment cannot invent empty effects and falsely close in that case.
- Added `INVOCATION_STATIC_SEMANTIC_AUTHORITY_VALIDATION_CONTRACT` with source identity, subject correlation, candidate cardinality, argument coverage, effect ownership, evidence provenance, rule-to-obligation correspondence, proof ordering, ledger equality, closure rules, and invalid-result behavior.
- Embedded the validation contract into static judgment model, coverage, and pipeline contracts.
- Bumped static judgment contract to v4, static argument/effect contract to v2, static model and coverage to v7, pipeline to v20, and Laravel scanner semantic boundary to v5.
- Exported the new public contract and types.
- Updated prior audits to validate the current contract versions and added `audit:phase1712-static-authority-validation-interface`.

## Verification

- Phase 1712 interface audit: 19/19 checks passed.
- Phase 1703–1711 regression audits: rerun after version synchronization; outcomes are recorded in the final delivery summary.

The Phase 1712 audit checks contract shape, ownership boundaries, and the resolved-target/effects-unavailable branch. Passing the audit does not imply that a validator implementation exists or that static invocation is supported at runtime.

## Remaining work

1. Implement the static invocation judgment algebra against these contracts.
2. Implement authority validation for source identity, evidence provenance, target cardinality, argument coverage, effect ownership, witness order, and rule-obligation correspondence.
3. Add runtime tests for closed, unresolved, ambiguous, argument-form-unproven, incomplete-binding, and unavailable-effect outcomes.
4. Only then migrate Laravel pipeline wiring and downstream consumers.

## Build and typecheck status

- `npm run build` cannot start because the `tsdown` executable is not installed in this environment (`sh: 1: tsdown: not found`).
- A targeted `tsc` invocation over the two changed interface files still fails on pre-existing diagnostics in imported modules, including `resourceModelMethodResolverOperation.ts`, `resourceModelMethodResolverProjection.ts`, and other resource/semantic modules. No diagnostics directly reference `invocationSemanticPipelineInterface.ts` or `laravelControllerScannerInterface.ts` in that run.
- A broader `tsc` run including `packages/core/src/index.ts` fails on existing missing exports, duplicate identifiers, and missing `axios` dependencies. Therefore, this phase does not claim a successful build or complete typecheck.
