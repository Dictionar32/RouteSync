# Phase 1925 — Laravel scanner interface boundary correction

## Trace

`controllerDataflowAnalyzer.ts` projects a `PhpBlock` into source-correlated semantic knowledge, composes that exact knowledge with `judgment.response`, derives binding-to-source-payload correspondence judgments, resolves variable identity for matched correspondence outcomes, projects definitions, composes variable flow, and returns `ControllerDataflowAst`.

The canonical invocation judgment is `LaravelControllerInvocationSemanticJudgmentInterface`. The integrated response is `InvocationSemanticIntegratedResponseCompositionResult`. They are intentionally distinct: the model retains both exact values rather than copying response state into a second judgment.

## Correction

Phase 1924 added `ControllerDataflowSemanticClosureInterface` with unconstrained generic collection members. That interface overclaimed semantic closure: two arrays do not prove complete binding coverage, correspondence-to-identity alignment, or a closed inventory. The generic fields also weakened already-existing domain ADTs.

Phase 1925 removes that generic closure interface and its contract. `ControllerDataflowAst` extends the existing `ControllerDataflowInvocationSemanticModelInterface` and declares its parser-specific correspondence and identity collections using the existing concrete judgment ADTs. The upstream semantic model remains free of parser-specific payload types.

The collections remain because one controller source may contain multiple bindings and identity judgments. They are not treated as closure evidence. A future closure claim requires an explicit source-coverage authority and receipt that proves each relevant binding has exactly one accounted-for correspondence and preserves the identity outcome associated with each matched correspondence.

## Scope boundary

This is an interface/model correction. The analyzer wiring is intentionally unchanged; the next phase should define and validate the source-coverage/paired-judgment contract before migrating the analyzer to consume it. No second invocation authority is introduced.

## Validation

- `audit-phase1925-controller-dataflow-interface-boundary.cjs`: 9/9
- `audit-phase1924-controller-dataflow-closure-interface-first.cjs` (updated as a regression guard): 7/7
- Build, TypeScript compilation, and full tests were not run.
