# Phase 1842 — Resource Binding Uses Integrated Controller Judgment

## Interface-first trace

The current upstream contracts already preserve the required correlation at the controller boundary:

- `LaravelControllerScanJudgment` owns the source project and correlated controller artifacts.
- Each `LaravelControllerScanArtifact` keeps its action contracts beside its source-bound `invocationJudgment`.
- `LaravelControllerInvocationSemanticJudgmentInterface` keeps `sourceFile` and the full integrated `response` in one value.
- `LaravelResourceScannerInterface` already receives the full `controllerScan` judgment.

The gap was one layer lower: `ResourceModelBindingJudgmentInput` accepted only a detached `controllerActions` array. That discarded the correlation to the controller's integrated invocation semantic response precisely at the model-binding authority boundary.

## Change

`ResourceModelBindingJudgmentInput` now accepts `controllerScan: LaravelControllerScanJudgment` rather than a detached action array. The subject remains source-level and does not accept a pre-populated `ResourceDefinition` as its own answer. Model candidates and relation evidence remain explicit inputs. This makes the authority boundary capable of consulting only the correlated controller/action/invocation evidence and keeps unresolved and ambiguous outcomes in the judgment algebra.

## Scope honesty / next migration gate

This phase is an upstream contract correction, not a claim that resource production wiring is migrated. `laravelSourceAstPipeline.ts` still invokes `ControllerScanner.scanCanonicalBundle()` for a legacy index and `ResourceScanner.scanCanonicalBundle()` for resource production. The resource interface still lacks a production implementation and the old subscanner has not been retired. The next phase should implement `LaravelResourceScannerInterface` against this strengthened contract, preserve AST/definition/model-binding judgment in one artifact, wire `SourceAsts`, and only then remove the legacy controller-index/resource scanner calls.

## Verification

Static audit: `audit:phase1842-resource-binding-integrated-controller-judgment` — 9 checks. Build, typecheck, and E2E were not run.
