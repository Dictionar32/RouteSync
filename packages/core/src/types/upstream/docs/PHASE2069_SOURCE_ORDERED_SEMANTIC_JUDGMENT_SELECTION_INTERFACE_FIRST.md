# Phase 2069 — Source-Ordered Semantic Judgment Selection, Interface First

## Trace finding

`ControllerVariableBinding.definitions` is a source-ordered sequence. The scanner helper named `latestAvailableSemanticJudgment` previously retained the first `some` result during a left fold. That behavior contradicted the helper name and the source-order contract: later definitions were ignored even when they carried a newer closed semantic judgment.

## Contract correction

`ControllerVariableBinding.definitions` now explicitly documents source-occurrence ordering and the consumer rule: current-binding selection uses the final available definition. The scanner fold now replaces its accumulated judgment at each definition, so the final element is selected. An empty sequence still maps to `Lookup`'s `missing` variant.

This does not introduce a second semantic authority. Each definition already carries its upstream `ControllerVariableSemanticJudgment`; the scanner only selects the source-latest judgment from the declared sequence. It does not reclassify the selected judgment.

## Architectural boundaries retained

- Laravel scanner: projects source-ordered definitions and consumes the selected judgment.
- Discriminated unions: `Lookup` preserves `found` / `missing`; semantic outcomes remain the existing closed `ControllerVariableSemanticJudgment` ADT.
- Invocation and integrated response: no new authority or duplicate judgment added.
- AST/ADT projection: continues to consume the selected upstream judgment.
- Runtime executor: unchanged; no semantic selection is moved into runtime execution.
- No new relation/foundation subscanner is introduced.

## Verification boundary

The Phase 2069 audit checks the contract documentation, final-element selection implementation, missing-sequence handling, regression coverage, and preservation of the existing invocation/response/AST contracts. Full typecheck, build, and Vitest are not claimed unless run separately.
