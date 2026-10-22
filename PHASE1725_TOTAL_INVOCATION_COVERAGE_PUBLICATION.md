# Phase 1725 — Total Invocation Coverage Publication

## Trace finding

The existing source-subject inventory separates ordinary invocation facts from static invocation facts, while `analyzeKnowledge` returns ordinary invocation analysis. The interface did not yet define a typed publication result that correlates each source subject with either its actual judgment or an explicit non-coverage disposition. This left total coverage publication underspecified.

## Interface-first change

- Added `InvocationSemanticCoveragePublicationEntry`, a domain-specific discriminated union.
- Ordinary invocation entries must either carry an actual `InvocationSemanticJudgment` or explicitly report `ordinary-analysis-omitted-source-subject`.
- Static invocation entries remain source facts and explicitly report `uncovered-source-fact`; no static judgment is fabricated.
- Added `InvocationSemanticCoveragePublicationInput` and `InvocationSemanticCoveragePublicationInterface` to define the upstream publication authority boundary.
- Required judgment form, knowledge identity, and source span to correlate with the published entry; structural typing alone does not enforce this relation, so the future authority must validate it.
- Exported the new types from `packages/core/src/index.ts`.
- Bumped coverage contract to v18, pipeline contract to v34, and Laravel scanner boundary to v13.
- The Laravel boundary now specifies that the scanner forwards the publication unchanged only after upstream publication authority exists.

## Non-goals and truthful status

This phase does not implement the publication authority, static algebra, static authority, or Laravel wiring. `controllerDataflowAnalyzer.ts` remains unchanged. The new interface defines the missing contract without claiming it is active at runtime.

## Verification

Run `npm run audit:phase1725-total-invocation-coverage-publication` from the repository root. The audit checks type/value synchronization, total-disposition variants, exports, and that production scanner wiring has not been falsely represented as complete.
