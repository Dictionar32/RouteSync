# Phase 2202 — CLI Response Projection Provenance Closure

## Root cause

Phase 2201 attached DTO response-contract judgments to each canonical `LaravelControllerMethodResponseProduct`. The existing response scanner projected each product into a `ResponseDefinition` and `ResponseAst`, then discarded the `LaravelControllerMethodResponseAstProjectionJudgment`. The source-AST pipeline consequently published the AST products but not the exact judgment that ties the output type, method product, and method-owned DTO contracts together.

This was a downstream provenance loss at the scanner-to-CLI aggregation boundary. It was not a reason to reconstruct semantics from ASTs or add another authority.

## Changes

- The existing response scanner bundle now includes `projectionJudgments`, preserving the exact `LaravelControllerMethodResponseAstProjectionJudgment` values used to produce response definitions and ASTs.
- The existing `SourceAsts` contract now includes `responseProjectionJudgments`.
- `laravelSourceAstPipeline` forwards `responseBundle.projectionJudgments` unchanged into `SourceAsts`.
- `LaravelSourceAstPipelineInterface` and `LaravelSourceAstScannerInterface`, plus their wired implementations, are bumped from contract version 3 to 4.
- The existing `upstreamManifestBuilder` retains the complete source-AST projection judgment as `manifest.ast`, so the added provenance remains in the CLI-facing manifest rather than being dropped at manifest construction.
- Added focused structural tests for scanner-bundle retention and source-AST/CLI-boundary forwarding.

## Trace

`DTO declaration owner ADT` → `method-owned DTO response contracts` → `LaravelControllerMethodResponseProduct` → `LaravelControllerMethodResponseAstProjectionJudgment` → `ResponseScannerBundle.projectionJudgments` → `SourceAsts.responseProjectionJudgments` → CLI-facing source-AST projection judgment.

The response AST remains the generated artifact; the retained projection judgment is the semantic provenance contract. Downstream consumers do not need to recover DTO ownership from `ResponseAst` or source-span matching.

## Boundaries and remaining work

- This phase does not remove the existing `compiler/scanner/subscanners/responseScanner.ts` location. It improves its output contract and traces its result through the existing source-AST pipeline; retiring the legacy directory requires a separate complete migration of its filesystem acquisition responsibilities and callers.
- This phase does not claim the DTO contract judgments currently determine response output type. The output-type authority still judges the canonical `ResponseResult`; DTO contracts are preserved as provenance, and their semantic contribution to output typing must only be added if an upstream contract proves that relationship.
- No `semantic/relation`, `semantic/foundation`, or replacement subscanner layer was introduced.
- Full typecheck, Vitest, and package build were not run as part of this phase.
