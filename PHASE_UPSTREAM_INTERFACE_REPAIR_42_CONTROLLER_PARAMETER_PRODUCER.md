# Phase 42 — Controller Parameter / Dataflow Producer Semantic Boundary

## Scope
Whole `packages/core/src`, excluding legacy `packages/core/src/compiler.ts`.

## Trace
The controller AST already required `ControllerVariableSemantic`, but the producer did not populate it. `controllerMethodParser.ts` created parameters without semantic facts, while `controllerDataflowAnalyzer.ts` created variable definitions without semantic facts. This forced `controllerDataflowContract.ts` to reconstruct model origins using `find()` over parameters/definitions and raw PHP AST values.

## Repair
- Added `request_origin` to canonical upstream `ControllerVariableSemantic`.
- `controllerMethodParser.ts` now assigns semantic facts at the parameter origin boundary:
  - Laravel `*Request` named parameters -> `request_origin`.
  - primitive parameters -> `external`.
  - named non-request parameters -> `model_origin`.
- `controllerDataflowAnalyzer.ts` now assigns semantic facts to assignment/foreach/catch definitions.
- Assignment definitions derive `model_origin` for `DB::table('...')` and model static calls; variable aliases inherit the previous definite definition semantic; other values become explicit `external` rather than missing semantic data.
- Upstream name ADTs are used directly; no domain-name cast is introduced.

## Verification
Targeted TypeScript compilation of the modified controller AST/dataflow files passes with zero errors.

The legacy `packages/core/src/compiler.ts` remains excluded.

## Remaining migration signal
`controllerDataflowContract.ts` still contains compatibility traversal for resource binding and raw-AST static-call detection. It is now a migration target, not the semantic origin. The next trace should replace that compatibility inference with the producer's semantic facts and canonical upstream controller dataflow.
