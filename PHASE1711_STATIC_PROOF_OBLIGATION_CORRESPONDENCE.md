# Phase 1711 — Static Proof / Obligation Correspondence Interface

## Scope

Interface-first refinement only. This phase does not implement static invocation algebra, authority validation, runtime execution, or Laravel scanner production wiring.

## Trace findings

- `packages/core/src/compiler/frontend/php/routeAst/phpAstExpressionSyntaxEvidenceRegistry.ts` emits `static-invocation` source facts.
- `packages/core/src/types/upstream/semanticDataflowKnowledge.ts` keeps static invocation as a distinct semantic fact.
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts` defines static target, argument-binding, effects, aggregate judgment, proof, and obligation contracts, but the static algebra and authority are explicitly not implemented.
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts` keeps controller scanning source-artifact-only and delegates invocation reasoning to the canonical pipeline.
- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` remains unchanged; production wiring still invokes concrete scanners directly.

## Changes

- `InvocationStaticClosedProofReceipt` now carries an empty obligation tuple.
- `InvocationStaticIncompleteProofReceipt` now requires a source-presence witness first and a target-resolution witness second, with explicit established/obligated outcomes.
- Incomplete proof receipts now carry a non-empty obligation ledger alongside the aggregate judgment's non-empty obligations.
- Every obligation now carries an explicit stable `InvocationStaticSemanticObligationIdentity` bound to its subject and semantic domain; argument-form obligations also identify the exact argument. The identity type is publicly exported.
- `InvocationStaticSemanticJudgmentContract` version advanced to 2 and states that proof and aggregate judgment must preserve the same obligation identities in the same order; closed proof carries none.
- `InvocationStaticJudgmentModelContract` and `InvocationSemanticCoverageContract` advanced to version 5; `InvocationSemanticPipelineContract` advanced to version 18.
- `LaravelControllerInvocationSemanticBoundaryContract` advanced to version 4 and explicitly forbids scanner reconstruction or reconciliation of proof obligations.
- Historical regression audits for Phases 1706–1710 were updated to validate the current contract versions.
- Added `audit:phase1711-static-proof-obligation-correspondence`.

## Audit results

- Phase 1711: 15/15 PASS
- Phase 1710: 20/20 PASS
- Phase 1709: 19/19 PASS
- Phase 1708: 15/15 PASS
- Phase 1707: 14/14 PASS
- Phase 1706: 10/10 PASS
- Phase 1705: 21/21 PASS
- Phase 1704: 12/12 PASS
- Phase 1703: 13/13 PASS
- Total: 139/139 audit checks PASS

## Build/typecheck status

- `npm run build` did not run because `tsdown` is not installed in this workspace (`sh: 1: tsdown: not found`).
- A targeted `tsc --noEmit --strict ...` attempt reported errors in existing unrelated files such as `resourceModelMethodResolverOperation.ts`, `resourceModelMethodResolverProjection.ts`, `resourceModelSurface.ts`, `modelPrimaryKey.ts`, `queryProducerSemanticInterface.ts`, `resourceModelKeyCapability.ts`, `routeSecurityAuthority.ts`, `semanticCapability.ts`, `semanticDataflow.ts`, `semanticDataflowAuthority.ts`, and `semanticReasoning.ts`. It emitted no diagnostics for the two changed interface files, but the typecheck did not pass.

## Open gap

Static invocation facts remain outside the implemented ordinary-invocation judgment algebra. The new interfaces constrain proof/obligation correspondence but do not constitute runtime support. Next interface-first step should formalize authority validation inputs and rule-specific obligation-to-witness correspondence before implementing algebra and authority; wiring remains gated on those implementations and validation.
