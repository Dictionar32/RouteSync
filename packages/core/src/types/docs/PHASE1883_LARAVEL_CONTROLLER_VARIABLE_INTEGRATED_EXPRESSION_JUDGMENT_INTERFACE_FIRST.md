# Phase 1883 — Laravel Controller Variable Integrated Expression Judgment

## Trace finding

Phase 1882 removed local classification from `controllerAstCanonical.ts`, but introduced a parallel upstream projection authority and a second projection judgment beside `ControllerVariableSemanticJudgment`. The scanner then unwrapped that sidecar to obtain `ResolvedExpression.result`. This duplicated the contract boundary instead of completing the existing judgment.

## Interface-first correction

- `ControllerVariableSemanticJudgment` now carries `expressionValue` for every closed outcome. The upstream authority and runtime executor interfaces expose `judgmentContract: 'semantic_and_expression_value_are_integrated'` so this ownership is part of the public contract.
- The resolved judgment is a discriminated union whose semantic variants correlate `model_origin` and `request_origin` with reference values, `expression` with an unsupported unresolved value, and `external` with an external unresolved value. The selected rule and source evidence remain on the same judgment.
- `not_resolved` retains an explicit external unresolved value; `contract_violation` retains an unsupported unresolved value.
- The existing upstream `controllerVariableSemanticAuthority` owns the mapping from controller semantic to expression vocabulary.
- `controllerAstCanonical.ts` now reads `definition.semanticResolution.expressionValue` directly. Missing source judgment is projected to an explicit unresolved external value without inventing a second authority judgment.
- Removed the redundant `ControllerVariableSemanticValueProjectionJudgment` and its authority, barrel exports, and generic sidecar property from `ResolvedExpression`.

## Scope

This phase changes the model and its direct consumer only. It does not refill the already-empty `actionVariableTracker.ts` or `controllerErrorDetector.ts`, and it does not claim that the entire controller subscanner directory is empty. No `semantic/foundation` dependency is introduced.

## Verification

The focused static audit checks the integrated judgment, direct projection, retired duplicate boundary, and preserved empty files. Full build and TypeScript compilation are intentionally not run in this environment.
