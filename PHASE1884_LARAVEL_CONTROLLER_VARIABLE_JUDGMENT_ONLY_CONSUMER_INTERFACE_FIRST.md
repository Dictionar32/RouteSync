# Phase 1884 — Laravel Controller Variable Judgment-Only Consumer Interface First

## Trace

`ControllerVariableDefinition` carried both `semantic` and `semanticResolution`. The latter is the upstream closed `ControllerVariableSemanticJudgment`; the former was a lossy projection produced by `semanticProjection()` in `controllerDataflowAnalyzer.ts`. The only scanner consumer of `definition.semantic` was `controllerDataflowContract.ts`, where the latest variable semantic was read to resolve resource model origins.

## Interface-first change

- Removed `ControllerVariableDefinition.semantic`; `semanticResolution` is now the sole semantic owner on each definition.
- Removed the analyzer's `semanticProjection()` helper and stopped publishing a duplicate semantic value.
- Replaced `lookupControllerSemantic()` with `lookupControllerSemanticJudgment()`, preserving the upstream judgment through the consumer lookup.
- Resource model-origin resolution now consumes only the correlated `resolved` judgment whose semantic variant is `model_origin`.
- Replaced a local cast-based option initializer with the existing typed `RelationOption` contract.
- Kept `actionVariableTracker.ts` and `controllerErrorDetector.ts` empty; no `semantic/foundation` dependency was introduced.

## Verification boundary

The focused audit verifies the contract shape and source references. This phase does not claim a full TypeScript compile or build. The scanner still contains other active semantic responsibilities (including direct static-call model-origin fallback); those need a separate upstream-interface trace before retirement.
