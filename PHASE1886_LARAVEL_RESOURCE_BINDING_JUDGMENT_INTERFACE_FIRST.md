# Phase 1886 — Laravel Resource Binding Judgment Interface First

## Trace finding

`packages/core/src/compiler/scanner/subscanners/controller/controllerDataflowContract.ts` previously combined AST-node recognition, controller-variable judgment interpretation, model-origin resolution, response-presence checks, and resource-binding construction in `collectResourceBindingsWithIndex` / `resolveModelOrigin`.

## Interface-first change

- Added `ControllerResourceBindingAuthorityInterface` and the closed `ControllerResourceBindingJudgment` ADT under `packages/core/src/types/upstream/`.
- The authority owns interpretation of variable semantic judgments and static-call origin judgments, and correlates model origin with response identity.
- The scanner now converts AST shapes into typed candidate evidence and forwards it to the upstream authority. It keeps source-range attachment and recursive AST traversal as source extraction/projection work.
- Missing variable judgments, unresolved model origins, absent responses, absent collection arguments, and unsupported collection argument shapes remain distinct outcomes.
- Exported the interface and authority from the upstream barrel; advanced the Laravel controller scanner contract version to 14 and boundary version to 56.
- Kept the already-empty `actionVariableTracker.ts` and `controllerErrorDetector.ts` empty.
- No dependency on `semantic/foundation` was introduced.

## Validation

The focused static audit checks the interface, judgment correlation, authority ownership, scanner delegation, barrel exports, version alignment, and preservation of the empty files. This phase does not claim full TypeScript compilation or a full build.
