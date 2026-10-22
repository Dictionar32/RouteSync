# Phase 1492 — Preserve Model-Origin Judgment Through Query AST

## Architectural evolution

Phase 1491 moved model-origin reasoning into `QueryProducerSemanticInterface`, but its scanner adapter immediately collapsed the closed judgment into `known | indeterminate`. That erased the difference between `not_applicable` and `malformed` at the AST boundary. Phase 1492 preserves the upstream judgment on both `QueryAst` and `QuerySubqueryAst` as `modelOriginJudgment`.

## Data path

`Expression evidence -> QueryProducerSemanticInterface.resolveModelOrigin -> QueryProducerSemanticJudgment<ModelName> -> QueryAst.modelOriginJudgment`

The existing `model` field remains as an explicitly named compatibility projection for downstream consumers that still require `known | indeterminate`. It is no longer the only representation of the model-origin result. New consumers can use the authoritative judgment and retain malformed/unsupported distinctions without rerunning semantic reasoning.

## Changes

- Added required `modelOriginJudgment` to `QueryAst` and `QuerySubqueryAst`.
- Replaced `modelFromReceiver(): RelationOption<ModelName>` with a direct judgment-returning `modelOriginJudgment()` wiring function.
- Isolated legacy `known | indeterminate` construction in `modelCompatibilityProjection()`.
- Updated the existing controller contract fixture to supply the new required contract field.

## Remaining frontier

- Migrate downstream consumers such as `controllerAstCanonical` from the compatibility `model` projection to `modelOriginJudgment` where their contracts can represent unresolved/malformed state.
- Unify `modelOriginStaticVocabulary` with `modelStaticOperationCatalog`; presently their argument contracts can still drift.
- Replace lossy `toLegacyOption` usage for query operation evidence with a typed projection/diagnostic boundary. Do not treat this phase as eliminating all scanner-local operation construction.

## Verification

The workspace has no `node_modules` or local `tsdown`/`tsc` executables, so build and test execution are unavailable in this environment. Source edits and archive structure are verified; build/test success is not claimed.
