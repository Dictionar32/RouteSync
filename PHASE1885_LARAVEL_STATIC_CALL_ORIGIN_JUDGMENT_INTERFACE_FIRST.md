# Phase 1885 — Laravel Static Call Origin Judgment Interface First

## Trace finding

`controllerDataflowContract.ts` previously owned the semantic interpretation of PHP static calls. It classified `DB::table('literal')` locally as a table origin and treated every other static call as a model-class origin. It also incorrectly fell back to `DB` as a model-class origin when the table argument was absent or dynamic.

## Interface-first change

- Added `ControllerStaticCallOriginInput`, `ControllerStaticCallOriginJudgment`, and `ControllerStaticCallOriginAuthorityInterface` under `packages/core/src/types/upstream/`.
- Added `controllerStaticCallOriginAuthority` as the semantic owner for static-call origin interpretation.
- The scanner submodule now adapts AST shape into typed source evidence and delegates the semantic judgment upstream.
- `DB::table(...)` resolves to a table origin only when its first argument is a positional string literal. Missing or unsupported/dynamic arguments yield an explicit unresolved judgment.
- Non-`DB::table` static calls retain the existing model-class origin behavior, but that behavior is now owned by the upstream authority rather than the scanner contract.
- Bumped the Laravel controller scanner contract to v13 and ownership boundary to v55.
- Kept `actionVariableTracker.ts` and `controllerErrorDetector.ts` empty.
- No dependency on `semantic/foundation` was introduced.

## Validation

The focused audit checks interface ownership, evidence normalization, unresolved outcomes, barrel export, scanner version alignment, and preservation of the previously emptied files. No full build or TypeScript compilation is claimed for this phase.
