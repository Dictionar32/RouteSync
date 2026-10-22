# Phase 2167 — Interface-first DTO inventory order and source-binding trace

## Finding

The previous phase's statement that a typed DTO inventory was not available upstream was too broad. A DTO semantic inventory already exists in the source-AST pipeline:

- `packages/core/src/compiler/scanner/subscanners/dtoAstCanonical.ts` exposes `scanDtoAsts(sourceProject): Promise<readonly DtoAst[]>`.
- `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` invokes `scanDtoAsts(sourceProject)` and publishes the resulting `DtoAst[]` in `SourceAsts.dtos`.

However, the source-AST pipeline currently invokes `laravelControllerScanner.scan(...)` before `scanDtoAsts(sourceProject)`. Therefore those DTO products cannot be supplied to the controller's integrated response judgment during that scan.

## Existing interface trace

`LaravelControllerScannerInterface.scan(LaravelControllerScanInput)` currently accepts form requests, query facts, contextual attribute names, model-class identities, and the closed invocation inventory. It does not accept the existing DTO semantic inventory.

`LaravelControllerResponseIntegratedJudgmentInput` currently accepts only the exact invocation judgment and `ControllerDeclarationEvidence`.

`LaravelControllerResponseEvidenceProductionInput` similarly receives the controller declaration evidence and a same-source correlation receipt. The producer's evidence union therefore cannot include DTO products from other source files without evolving the existing source-binding contract.

## Critical contract mismatch

`LaravelControllerResponseEvidenceSourceBindingContract.completeMeaning` requires every evidence item to bind to the exact invocation source file. A DTO declaration normally resides in a different file from the controller. Simply adding `DtoAst` items to the current evidence list would cause legitimate cross-file declarations to be treated as different-source rejection.

The correct fix is **not** to weaken the same-source check or to append DTO evidence to the controller-source evidence tuple. The existing binding interface must distinguish:

1. controller-local evidence, which must bind to the invocation's exact source file; and
2. referenced DTO declaration evidence, which must be proven to belong to the same source project and be uniquely resolved by the response-attribute reference.

The project inventory's existence alone is not proof that a particular DTO reference resolves uniquely. That proof must be represented in a closed typed judgment before response semantics can be completed.

## Required migration order

1. Evolve the existing `LaravelControllerScanInput` and integrated-response input contracts to carry the already-produced typed DTO inventory; do not create a second DTO scanner or authority.
2. Move the existing `scanDtoAsts(sourceProject)` call before controller scanning in `laravelSourceAstPipeline.ts` and pass that exact inventory through the existing scanner interface.
3. Evolve the existing response evidence/source-binding ADTs to represent cross-file DTO declaration evidence with project-membership and unique-reference-resolution receipts, while preserving exact-file binding for controller-local evidence.
4. Evolve the existing response semantic judgment to consume the closed DTO resolution judgment and descriptor evidence.
5. Only after the integrated path proves equivalent response products should `resolveResponse()`, `responseAttributeScanner.ts`, and `responseDtoReader.ts` be retired.

## Invocation and executor boundary

No change is indicated for `InvocationSemanticAuthorityInterface` or `InvocationSemanticRuntimeExecutorInterface`: the executor delegates to the authority and should continue to execute a closed invocation contract. The unresolved work belongs in the existing response evidence, binding, and judgment contracts before AST projection.

## Scope constraints

- No new `relation/foundation` layer.
- No new response subscanner.
- No duplicate invocation or response authority.
- No semantic inference in the runtime executor.
- Do not claim legacy retirement until the integrated response judgment consumes the DTO resolution evidence.
