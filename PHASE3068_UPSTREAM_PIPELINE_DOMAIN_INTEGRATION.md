# Phase 3068 — Upstream Pipeline Domain Integration

## Why this phase exists

Phase 3067 removed one generic API from route schema evidence, but the whole-file PHP semantic producer still exposed `continueWith<Result>(handlers)` on `PhpSourceInvocationSemanticPipelineResult`. The integration consumer selected complete/blocked behavior through callbacks. That is an upstream contract problem, not something to solve by shortening downstream syntax.

## Change

- Replaced the generic result-handler contract on the whole-file PHP invocation pipeline ADT with the domain operation `integrateWithControllerSourceBinding(sourceBinding)`.
- Replaced generic continuation on source-binding judgments with `toPipelineCompositionEvidence()`, preserving the exact closed/rejected identity judgment.
- Replaced generic continuation on composition evidence with `toControllerInvocationIntegrationResult()`, so the evidence ADT owns its transition into the integrated result.
- Implemented the operation in the upstream producer authority for both complete and blocked judgments. Each outcome constructs its corresponding integration result directly.
- Changed `phpSourceInvocationSemanticPipelineIntegration.ts` to call the producer-owned operation rather than pass `onComplete` / `onBlocked` callbacks to the pipeline result.
- Preserved the exact pipeline result, closed source-binding judgment, source identity evidence, and complete invocation batch. Blocked outcomes remain blocked and cannot be promoted to complete.
- Bumped the pipeline contract version from 3 to 4.
- Kept the protected one-byte `collections.ts` invariant and did not restore deleted relation foundation modules.

## Runtime trace

`PHP source document → frontend coverage validation → source inventory → environment projection → name resolution → closed invocation batch → PhpSourceInvocationSemanticPipelineResult (complete | blocked) → integrateWithControllerSourceBinding(closed source binding) → controller invocation integration result → Laravel controller scanner → source AST pipeline → manifest builder → CLI scan/sync blocked gate → manifest/IR output`.

The key change is at the producer ADT: its domain operation owns the complete-versus-blocked continuation. The integration consumer no longer supplies a generic result type or callback handlers to choose the path.

## Audit

Run `npm run audit:phase3068-upstream-pipeline-domain-integration`. The audit verifies producer ownership, complete/blocked payload preservation, consumer migration, existing manifest blocker gates, absence of deleted relation foundation modules, and the protected collections invariant. It also runs Phase 3067 and Phase 3062 regression audits.

## Limits

- This phase does not claim that all generic APIs are gone. The source-file identity relation judgment still exposes a generic continuation API and is the next upstream target on this path.
- Strict TypeScript is blocked by existing repository issues and incomplete ambient type packages; the focused command did not produce a clean repository typecheck.
- Vitest could not be run because its dependency installation is incomplete.
- An executed PHP → CLI → manifest/IR end-to-end fixture remains outstanding.
- No global primitive elimination is claimed. Parser boundaries and closed ADT semantics must be preserved rather than mechanically deleting syntax.
