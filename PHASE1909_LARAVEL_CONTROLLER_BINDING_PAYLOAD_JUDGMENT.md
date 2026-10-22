# Phase 1909 — Laravel Controller Binding/Payload Judgment

## Trace finding

Phase 1908 made the required boundary explicit but left a dangerous runtime behavior in `controllerDataflowAnalyzer.ts`: an unmatched binding span was converted into a synthetic `PhpAstFactory.unsupported([])` value, then processed as though it were a normal payload. That erased the difference between source evidence missing from the adapter and a real unsupported PHP expression. The prior matching also compared offsets without requiring the same canonical source file.

## Changes

- Added `types/upstream/controllerDataflowBindingPayloadCorrespondenceInterface.ts`, a PHP-AST-agnostic upstream value contract with closed `matched`, `missing`, and `ambiguous` outcomes.
- Added canonical source payload evidence carrying `SourceSpan` and a generic payload value.
- Added `bindingPayloadCorrespondence` to the controller AST dataflow model so each binding's correspondence outcome remains observable.
- Changed payload evidence to use canonical `SourceSpan` (`SourceFile`, `NumberValue` start/end) and require file identity plus equal start/end offsets.
- Removed the synthetic unsupported-expression fallback. Only `matched` correspondence judgments are reduced into `ControllerVariableDefinition`; missing and ambiguous judgments remain in the returned dataflow model rather than being fabricated or silently lost.
- Bumped the Laravel scanner boundary contract to version 75 and documented the new outcome-retention invariant.
- Preserved the exact `LaravelControllerInvocationSemanticJudgmentInterface` and the composition result derived from `judgment.response`; neither is reconstructed or replaced.

## Scope still open

This is a meaningful correctness fix, not a claim that the scanner is now wiring-only. The analyzer still performs correspondence execution, variable-origin normalization, PHP-to-upstream expression projection, and variable grouping. The next interface-first step is to make the correspondence execution and origin judgment actual upstream authorities, then reduce the analyzer to wiring and verify all consumers. No build or TypeScript typecheck was run, per workspace constraints. The static audit checks source invariants only and does not prove compilation.
