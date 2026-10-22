# Phase 1902 — Controller Dataflow Canonical Judgment Retention

## Trace

`LaravelControllerInvocationSemanticJudgmentInterface` was already the canonical closed judgment. The parser forwarded it into `analyzeControllerDataflowWithInvocationJudgment`, but the lower-level analyzer then accepted `response` and `filePath` as independent arguments. This weakened the very boundary the wrapper was meant to preserve.

## Interface-first correction

- Evolved the existing `LaravelControllerInvocationSemanticBoundaryContract` in place to version 69.
- Changed the dataflow analyzer to receive the canonical judgment as one value.
- Derived the source path and integrated response from that same judgment inside the analyzer.
- Preserved the exact judgment on `ControllerDataflowAst` beside the composed integrated response.
- Removed two unused analyzer entry points that could create a disconnected response or accept a source-binding result without the canonical judgment. Repository trace found no callers for either entry point.
- Kept syntax-only AST projection separate; it still does not manufacture semantic dataflow.

## Dependency boundary

This phase adds no dependency on `packages/core/src/semantic/relations` or `packages/core/src/semantic/foundation`. Existing relation imports elsewhere in the controller scanner are not migrated by this phase, so neither directory is claimed to be removable yet.

## Validation

The Phase 1902 static audit checks the actual analyzer signature, judgment retention, production call path, existing contract version, and forbidden foundation dependency. `node --check` and JSON validation are run. TypeScript compilation and package build are intentionally not run in this environment.
