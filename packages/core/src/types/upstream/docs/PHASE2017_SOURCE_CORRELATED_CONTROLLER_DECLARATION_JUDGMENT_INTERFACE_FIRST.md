# Phase 2017 — Source-correlated controller declaration judgment

## Trace finding

The controller declaration authority previously returned selections keyed for runtime lookup only by `ControllerName`. The scanner derives that name from `path.basename(sourceFile, '.php')`. Two distinct controller source files can share that basename, so `.find(selection => selection.controller.value.value === controllerName)` can bind a controller invocation judgment to the wrong declaration selection.

## Contract-first change

- `ControllerDeclarationSemanticCandidate` now requires the typed `SourceFile` that owns the declaration evidence.
- `ControllerDeclarationSemanticSelection` preserves the same `SourceFile` provenance.
- The existing declaration authority carries the candidate's exact source identity into its closed selection judgment.
- `laravelControllerScanner.ts` constructs candidates from `invocationJudgment.sourceFile` and correlates the returned selection by that source-file identity rather than by basename.
- The existing scanner contract version advances from 23 to 24 to make the contract evolution explicit.
- The existing authority test includes duplicate controller names with different source paths and verifies that the selection keeps both identities distinct.

## Semantic boundary

This change does not create a second declaration authority and does not change the meaning of complete/blocked ancestry outcomes. It fixes correspondence between an existing judgment and its source subject before the runtime executor consumes its action selection. Inheritance parent lookup still uses the current `ControllerName` evidence; namespace-aware parent identity is a separate unresolved contract boundary and is not claimed to be solved by this phase.

## Verification limits

The audit checks contract shape, provenance propagation, source-correlated selection lookup, contract-version alignment, and the regression fixture. Syntax transpilation is not a full TypeScript typecheck or build.
