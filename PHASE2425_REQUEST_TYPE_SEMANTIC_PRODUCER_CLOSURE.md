# Phase 2425 — RequestType Semantic Producer Closure

## Status

**Blocked at the semantic producer boundary; no fake integration applied.**

Phase 2424 repairs the route declaration provenance contract so the original AST `SourceSpan` reaches `RouteSemanticFlow` and the RequestType occurrence-location ADT. The remaining blocker is not runtime execution or projection wiring: the production semantic producer required by the existing interface-first contract is absent.

## Trace evidence

1. `packages/core/src/compiler/scanner/wiring/routeManifestTypeLowering.ts` still calls `requestTypeDerivationProjectionPipeline.derive(...)`.
2. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProjectionPipeline.ts` calls `createDerivationContext(...)` and `aggregateRequestTypeGroups(...)`.
3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSolver.ts` produces `RequestType[]` directly. It does not produce the closed `RequestTypeDerivationJudgment` plus `RequestTypeDerivationProof`, source receipts, contribution receipts, closure ledger, and verified-law coverage required by the upstream contract.
4. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticPipelineAssembler.ts` composes injected `reasoning`, `verifier`, `decision`, and `authority` capabilities, but repository source search found no production composition implementing those capabilities for RequestType derivation.
5. `packages/core/src/compiler/scanner/wiring/routeManifestTypeLoweringAuthority.ts` and `routeManifestProjectionAuthority.ts` expose an injected authority-backed alternative, but the active default path does not use it.
6. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationAuthority.ts` is only a trust-boundary adapter over an injected `RequestTypeDerivationSemanticKernel`; it does not implement the missing semantic kernel.

## Why the active path was not switched

The existing contract explicitly requires source evidence to be transformed into a closed judgment with a proof that accounts for every route/resource/request disposition, unresolved evidence, conflicts, and group contribution receipts. Wrapping the legacy solver's bare `RequestType[]` in a fabricated `derived` judgment would claim proof obligations were verified when no such proof was produced. Wiring an absent implementation would instead make the active CLI path unusable.

Therefore Phase 2425 does **not** switch the active lowering path to a fake authority and does not report the interface-first chain as complete.

## Required implementation sequence

1. Implement the existing `RequestTypeDerivationSemanticReasoningInterface` in the semantic owner, using the canonical route/resource/request evidence and exact source-occurrence coordinates.
2. Implement the existing `RequestTypeDerivationProofVerificationInterface` against every law in `REQUEST_TYPE_DERIVATION_LAW_IDS`; it must verify, not repair, judgments.
3. Implement the existing `RequestTypeDerivationSemanticDecisionInterface` and `RequestTypeDerivationSemanticAuthorityInterface` using their existing closed ADTs and shared canonical contract instance.
4. Add tests for same-line duplicate route declarations, ambiguous request identities, duplicate resource identities, unresolved evidence, incompatible group contributions, and every non-projectable judgment.
5. Assemble these capabilities using `createRequestTypeDerivationSemanticPipelineAssembler`.
6. Inject the assembled pipeline through the existing authority-backed manifest projection into the active manifest/CLI composition root.
7. Remove the legacy projection call only after the authority-backed path passes the same observable CLI regressions.

## Technical reference

TypeScript's official handbook describes discriminated unions as a way to encode distinct variants and uses `never` for exhaustiveness checks. This supports exhaustive handling of the existing result ADTs, but it does not supply the missing domain proof producer:
- https://www.typescriptlang.org/docs/handbook/2/narrowing.html

## Validation boundary

- Phase 2424 route-provenance audit: 8/8 assertions passed before this report was added.
- Source trace: confirmed by direct search of the files listed above.
- Full typecheck, package build, Vitest, and CLI integration: not run in this environment.
- No claim is made that RequestType interface-first lowering is complete.
