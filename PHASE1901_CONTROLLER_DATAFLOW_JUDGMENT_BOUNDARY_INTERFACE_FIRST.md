# Phase 1901 — Controller Dataflow Judgment Boundary, Interface First

## Trace

The Phase 1900 parser projection already carries one `LaravelControllerInvocationSemanticJudgmentInterface`, but the last runtime binding split it into two independent arguments (`filePath` and `integratedResponse`). That weakens the canonical source-identity/response correlation at the dataflow execution boundary.

## Interface-first correction

- Evolved the existing `LaravelControllerInvocationSemanticBoundaryContract` in place from v67 to v68.
- Added `dataflowProjectionInputOwnership`, requiring the dataflow projection entry to accept the canonical judgment as one value.
- Changed the controller dataflow runtime binding to accept `LaravelControllerInvocationSemanticJudgmentInterface` and derive both `judgment.sourceFile` and `judgment.response` from that same value.
- Updated `controllerBodyParser.ts` to forward `context.judgment` without detaching its source identity or integrated response.
- Kept syntax-only projection free of dataflow analysis.
- Added a static audit under `scripts/audits`.

## Explicit limitations

This phase does not remove existing `semantic/relations` dependencies from the Laravel scanner/parser family. It adds no dependency on `semantic/relations` or `semantic/foundation`, does not recreate `semantic/foundation`, and does not add a parallel invocation-judgment model. Build and TypeScript compilation were not run.
