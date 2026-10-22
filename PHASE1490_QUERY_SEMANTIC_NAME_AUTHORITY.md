# Phase 1490 — Query Semantic Name Authority

## Change

- Added `resolvePropertyName` and `resolveRelationName` to `QueryProducerSemanticInterface`.
- Implemented both as closed semantic judgments in `queryProducerSemanticAlgebra` using typed string-literal evidence.
- Replaced scanner-local classification of property/relation names with wiring through the upstream interface.
- Added tests for successful resolution and the distinction between absent evidence (`not_applicable`) and invalid evidence (`malformed`).

## Boundary result

`queryEvidenceProducer` no longer decides whether an expression is a string literal for property/relation-name classification. The semantic algebra owns that decision; the scanner only adapts the resolved judgment to the legacy option shape required by existing consumers.

## Remaining known boundary

The legacy `toLegacyOption` adapter still collapses `malformed` into `none`; existing consumers need a diagnostic-bearing AST/diagnostic channel before that projection can be removed safely. `modelFromReceiver` and the model-static operation catalog also remain scanner-owned and are not claimed as migrated in this phase.

## Verification

- Static diff and call-site inspection completed.
- `tsc --noEmit -p tsconfig.json` could not run successfully in this environment: the workspace has no installed dependencies/types and the globally available compiler is TypeScript 5.8.3 while the repository targets TypeScript 7.0.2. This is an environment limitation, not a passing typecheck.
- Unit tests were added but not executed because workspace dependencies (including Vitest) are not installed.
