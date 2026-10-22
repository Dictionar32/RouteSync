# Phase 1881 — Laravel Controller Producer Judgment Binding, Interface First

## Trace finding

`LaravelControllerScannerInterface` already accepts an authority-closed inventory and passes each source-correlated `LaravelControllerInvocationSemanticJudgmentInterface` into `parseControllerDeclarationFromInvocationJudgment`. However, the downstream `controllerProducer` accepted `declaration`, `file`, and `source` as independently supplied values, then returned an AST without returning the judgment. The scanner later attached the original judgment separately. Although the current call site derived those fields from the same `fullPath`, the upstream producer contract did not close that relationship.

## Interface-first correction

- Advanced `ControllerProducerContract` to v2.
- Replaced independent `file` and `source` inputs with the existing source-correlated `invocationJudgment`.
- Canonical AST provenance now takes its source file from `invocationJudgment.sourceFile`; source offsets remain from declaration evidence.
- `ControllerProducerResult` forwards the exact same judgment without reconstructing, widening, or reclassifying its integrated response.
- `LaravelControllerScanArtifact` receives the judgment from the producer result, keeping the produced AST and the source-correlated judgment on one production path.
- Advanced Laravel controller scanner input/output contract versions to v11 and the boundary contract/value to v53.
- Updated the focused historical audits to track the current scanner contract version.

## Existing directory state preserved

`actionVariableTracker.ts` and `controllerErrorDetector.ts` remain empty. This phase does not repopulate them, claim the whole `subscanners/controller/` directory is empty, or remove the remaining live modules. `controllerProducer.ts` remains a transitional implementation behind the upstream-owned interface, not a declaration of the intended permanent architecture.

## Verification

Run `npm run audit:phase1881-laravel-controller-producer-judgment-binding-interface-first`. The audit checks the upstream interface shape, judgment identity flow, AST source provenance, four outcome variants, contract versions, empty-file preservation, and absence of a `semantic/foundation` dependency. No full build or TypeScript compilation is claimed.
