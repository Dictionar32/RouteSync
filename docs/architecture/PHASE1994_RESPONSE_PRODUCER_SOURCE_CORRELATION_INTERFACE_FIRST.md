# Phase 1994 — Response Producer Declaration Source Correlation

## Goal

Strengthen the existing response-evidence producer contract before wiring or runtime changes. Do not add `relation` / `foundation` subscanners and do not create a second source-identity authority.

## Trace findings

- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still creates a `response_present` value from `result.descriptor.response.responseTypeName()`.
- The scanner then builds `ControllerMethodEvidence` and `ControllerDeclarationEvidence`, and calls `controllerProducer.produce({ declaration: declarationEvidence, invocationJudgment })`.
- `LaravelControllerResponseEvidenceProductionInterface` exists as a declaration, but the scanner does not call it.
- The response-reference evidence type correctly names the descriptor result as a candidate, not direct proof of a PHP `return` expression.
- The producer input previously accepted an invocation judgment and declaration evidence without a source-correlation receipt. The contract therefore did not explicitly require the producer's declaration to be correlated to the exact invocation source before observing methods.

## Interface change

`laravelControllerResponseSemanticJudgmentInterface.ts` now declares `LaravelControllerResponseEvidenceProductionSourceCorrelation<InvocationJudgment>`.

The receipt records:
- the exact invocation source subject;
- the controller declaration's source file;
- the existing `same_source_file_identity` judgment, owned by `LaravelSourceIdentitySemanticsInterface`.

`LaravelControllerResponseEvidenceProductionInput` requires this receipt. Both empty and present inventories retain the same receipt. Producer contract version is now 3, with explicit obligations that the producer must neither infer/recompute source identity nor discard the source-correlation receipt.

The new type is exported from `packages/core/src/index.ts`.

## Invariants

1. Descriptor-derived response references remain candidates, not parser-observed PHP returns.
2. Declaration source correlation is an upstream precondition; producer does not become an identity authority.
3. Per-evidence source binding remains a separate subsequent judgment.
4. Empty response evidence remains distinct from missing declaration observations.
5. No `relation/foundation` subscanner is introduced.

## Verification

- Structural audit: 14/14 checks pass (`scripts/audits/audit-phase1994-response-producer-source-correlation-interface.cjs`).
- TypeScript `transpileModule` syntax diagnostics: 0 for the modified interface and public export file.
- Full project typecheck/build: not run.
- Runtime producer and scanner wiring: not migrated in this phase.

## Next interface-first step

Before wiring the producer, define the explicit rejected declaration-source-correlation outcome at the contract boundary (rather than allowing a mismatched declaration to be silently passed into a producer), then derive producer output from the existing `ControllerDeclarationEvidence.methods` ADT. Only after those contracts are stable should the scanner implementation be migrated to produce response judgment and carry it in `LaravelControllerScanArtifact`.
