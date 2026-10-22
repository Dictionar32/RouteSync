# Phase 1996 — Response Pipeline Dependency Contract, Interface First

## Objective

Make the Laravel controller scanner's response-stage dependencies explicit before wiring. This phase composes existing upstream interfaces only; it does not add a response subscanner, relation/foundation layer, or a second semantic authority.

## Contract changes

- Added `LaravelControllerResponseSemanticPipelineInterface`, a dependency composition of the existing source identity semantics, response evidence producer, source-binding authority, and response runtime executor.
- Added `LaravelControllerResponseSemanticPipelineContract`, which specifies ownership and ordering from invocation/declaration source correlation through evidence production, source binding, response judgment, and executor forwarding.
- Made `LaravelControllerScannerInterface.responseSemanticPipeline` required and advanced its contract version to 20. The scan judgment contract version was advanced to 20 as well.
- Exported both pipeline interface and contract from the public core entry point.

## Trace findings retained as explicit gaps

- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still constructs response candidates from controller-action descriptors. It does not yet consume `responseSemanticPipeline`.
- The scanner implementation still creates `LaravelControllerScanArtifact` without `responseJudgment`, although the artifact ADT requires it.
- No runtime producer, source-binding authority, response authority, or executor implementation was added by this interface-first phase.
- Existing `semantic/relations` references remain in the controller scanner and subscanner tree. This phase does not add new relation/foundation subscanners and does not claim existing references were removed.

## Intended order for the next wiring phase

1. Obtain the invocation judgment and declaration source from the same parsed controller source.
2. Ask the existing `LaravelSourceIdentitySemanticsInterface` for the source identity judgment; only its same-source variant can form the producer's success receipt.
3. Invoke the existing response evidence producer.
4. Bind each produced evidence item through the existing source-binding authority.
5. Pass the closed binding judgment and original invocation judgment to the response runtime executor.
6. Attach that exact closed response judgment to the controller artifact and forward it through AST projection.

The executor must forward the authority-owned ADT unchanged; it must not classify descriptors, infer source identity, or reconstruct provenance.

## Verification

The phase audit checks contract presence, dependency ownership, required scanner boundary, public exports, and absence of newly added relation/foundation subscanners. Full TypeScript typecheck/build was not run. The scanner implementation is intentionally not yet wired to the newly required interface; this is the known implementation frontier for the next phase, not a claim of a build-clean state.
