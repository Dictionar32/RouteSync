# Phase 1991 — Response Evidence Producer Contract (Interface First)

## Trace finding

The controller scanner already assembles `ControllerDeclarationEvidence.methods`. Each `ControllerMethodEvidence` carries a `ControllerActionFlowContract` whose `action.response` is the existing `ControllerResponse` ADT (`response_present` with a `ResponseReference`, or `response_absent`) and a method `SourceSpan`. The response semantic interface, however, only modeled descriptor/DTO evidence. That left a contract gap between source-backed controller return references and response source binding.

The response reference is evidence, not a resolved response product. It must not be promoted directly to `controller_response_complete`.

## Contract change

`laravelControllerResponseSemanticJudgmentInterface.ts` now declares:

- `observed_controller_response_reference`, retaining `ResponseReference`, method `SourceSpan`, and `SourceFile`;
- `LaravelControllerResponseEvidenceProductionInput`, tied to the already-closed invocation judgment and existing `ControllerDeclarationEvidence`;
- `LaravelControllerResponseEvidenceProductionInventory`, an ADT for empty or non-empty observed-reference inventories;
- `LaravelControllerResponseEvidenceProductionInterface`, with a narrow output that only permits observed controller response references;
- `LaravelControllerResponseEvidenceProductionContract`, requiring one evidence item per `response_present` action, no evidence for `response_absent`, explicit empty inventory, and no promotion to a resolved semantic product.

The producer's output is structurally consumable by the existing source-binding input, after which the existing `LaravelSourceIdentitySemanticsInterface` remains the sole source-identity owner. Response authority remains the only owner of closed response meaning.

## Ownership sequence

`ControllerDeclarationEvidence.methods` → response evidence producer contract → source-binding authority → response semantic authority → `LaravelControllerScanArtifact` → invocation/response wiring → AST projection/runtime executor.

This phase adds declarations only. It does not implement the producer, wire it into `laravelControllerScanner.ts`, fabricate `responseJudgment`, or remove any subscanner. Runtime integration is the next phase after this contract is accepted.

## Trace boundaries

- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` currently creates `ControllerDeclarationEvidence`, then calls `controllerProducer.produce(...)`; it still builds an artifact containing `invocationJudgment` without `responseJudgment`.
- `packages/core/src/types/upstream/controllerEvidence.ts` defines the source-backed method evidence.
- `packages/core/src/types/upstream/controller.ts` defines the `ControllerResponse` ADT.
- `packages/core/src/types/upstream/laravelControllerResponseSemanticJudgmentInterface.ts` owns the response evidence and source-binding contracts.
- Existing `semantic/relations` references remain in the controller scanner tree; this phase creates no relation/foundation subscanner and deletes none.

## Verification limits

The audit checks declaration shape, public export, evidence provenance fields, empty/present inventory variants, narrow producer output, and absence of runtime implementation changes. A structural audit does not prove TypeScript project typecheck or runtime integration.
