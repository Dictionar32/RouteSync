# RouteSync Phase 1732 — Invocation Judgment Authority Boundary

## Objective

Strengthen the upstream interface contract before changing Laravel scanner wiring. The authority is explicitly a validator of algebra-produced semantic judgments, not a second semantic derivation engine. The scanner contract explicitly delegates and preserves the judgment rather than reconstructing it.

## Trace

- `packages/core/src/types/upstream/invocationSemanticJudgmentInterface.ts`: `InvocationSemanticAuthorityInterface.analyze(InvocationSemanticInput)` returns the discriminated `InvocationSemanticJudgment`.
- `packages/core/src/types/upstream/invocationSemanticExecutionBoundaryContract.ts`: authority boundary now makes requested-subject binding, derivation/validation separation, and rejection semantics explicit (v1 → v2).
- `packages/core/src/types/upstream/invocationSemanticPipelineInterface.ts`: pipeline contract version bumped v40 → v41 to inherit the strengthened authority boundary.
- `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`: scanner boundary version bumped v19 → v20 and explicitly forbids reconstructing judgments or repairing authority failures.
- `packages/core/src/types/upstream/invocationSemanticRuntimeExecutor.ts`: existing runtime executor delegates `execute(input)` to `authority.analyze(input)`.
- `packages/core/src/compiler/scanner/lexer/controllerDataflowAnalyzer.ts`: existing scanner calls `invocationSemanticPipeline.analyzeKnowledge(...)`.

## Changes

- No production scanner wiring was changed.
- No semantic reasoning was moved into another file.
- No `core/src/semantic/foundation` dependency was introduced.
- Static invocation remains contract-only and is not represented as implemented coverage.
- Historical Phase 1721–1731 audit source scripts were aligned to the new pipeline/scanner contract versions.

## Verification

Run `npm run audit:phase1732-invocation-judgment-authority-boundary` from the RouteSync root. TypeScript/package build was not run in this phase.

## Remaining frontier

The coverage publication authority remains interface-only. Next, strengthen and implement its correspondence validation with mismatch/duplicate/missing-evidence fixtures before changing scanner wiring.
