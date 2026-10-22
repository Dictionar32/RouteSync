# Phase 2052 — Response Attribute Semantic Judgment Interface First

## Trace finding

Phase 2051's runtime inventory identified `responseAttributeScanner.ts` functions `inferObservedValue`, `inferPhpAstValue`, `inferNestedArray`, `mergeObservedValues`, and `mergeContracts` as semantic reasoning rather than structural projection. They classified PHP AST literals/arrays into response value contracts, selected object versus collection semantics, and merged competing observed values in scanner runtime.

## Contract evolution

Added `ResponseAttributeValueSemanticJudgmentInterface` with two closed contracts:

- `ResponseObservedValueEvidence`: literal, array-entry evidence, or unsupported evidence. It does not depend on `PhpAstValue` or token implementation types.
- `ResponseObservedValueJudgment`: resolved response value or explicit unsupported evidence.
- `ResponseValueMergeJudgment`: merged response contract or explicit empty input.

The existing `responseAttributeValueSemanticAuthority` owns the interpretation of these evidence variants and structural response-value equality/merge. It returns domain `ResponseValueContract` values; it does not create a new integrated response authority or invocation authority.

## Scanner change

`responseAttributeScanner.ts` now only projects PHP AST shape into the closed `ResponseObservedValueEvidence` ADT and delegates inference/merge to the upstream authority. The runtime implementations `inferPhpAstValue`, `inferNestedArray`, `mergeContracts`, and JSON-serialization-based equality were removed. Unsupported AST expressions remain explicit rather than being guessed. String-keyed arrays produce object fields; positional, unpacked, or non-string-keyed entries produce collection semantics.

This is not a simple function relocation: the semantic boundary now accepts AST-independent typed evidence, owns a closed judgment, and merges contracts through typed ADT comparison instead of JSON serialization.

## Runtime function status

The detailed disposition is recorded in `scripts/audits/phase2052-runtime-function-migration-status.csv`. It distinguishes semantic inference removed from scanner runtime, thin evidence/field adapters that remain, and the next candidates. The Phase 2051 inventory remains intact as the historical full declaration inventory.

## Remaining runtime-function candidates

Continue the Phase 2051 inventory in this order:

1. `astClassifierRuntime.ts`: legacy adapters for closure, arrow, parenthesized, class references, static calls, and member expressions. Do not add another AST facade; evolve the existing AST rule judgment contract and retire legacy adapters one by one.
2. `controllerDataflowContract.ts`: `buildSemanticDataflow`, `collectResourceBindings`, `resourceBindingCandidate`, and `modelOriginEvidence`. Separate AST evidence projection from resource-origin judgment; reuse the existing controller dataflow authority.
3. `controllerAstCanonical.ts`: `semantic`, `controllerMethodContractFromMethod`, and `controllerActionFromMethod`. Ensure all semantic products are derived from the canonical method projection rather than independently reclassified.
4. `propertyPathResolution.ts`, `fieldBinder.ts`, and `resourceBinder.ts`: model unresolved, ambiguous, and resolved bindings as closed judgments before simplifying binder runtime.
5. `responseDetector.ts`: convert remaining response detection to typed candidate evidence and the existing response pipeline.

Pure constructors and structural projections are not required to become authorities. Runtime execution may remain as dispatch, but it must not independently infer response meaning. No relation/foundation subscanner is introduced.

## Verification boundary

The audit script checks interface/authority ownership, AST-independent evidence, closed judgments, scanner delegation, unsupported-value handling, and regression test presence. This phase does not claim a full build or test-suite pass.
