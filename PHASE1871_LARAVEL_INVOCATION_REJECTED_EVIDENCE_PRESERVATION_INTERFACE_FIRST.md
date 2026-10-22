# Phase 1871 — Laravel invocation rejected-evidence preservation, interface first

## Trace

`PhpSourceInvocationSemanticPipelineResult` → `PhpSourceInvocationSemanticSourceBindingInput` → `PhpSourceInvocationSemanticSourceBindingJudgment` → `PhpSourceInvocationSemanticPipelineCompositionEvidence` → `PhpSourceInvocationSemanticPipelineIntegrationResult` → `LaravelControllerInvocationSemanticJudgmentInterface.response` → `LaravelControllerScanArtifact.invocationJudgment` → resource integrated response.

Phase 1870 strengthened the successful path: complete and blocked integrated responses retain the exact closed source-binding judgment. The trace found the complementary rejection-path gap: `php_source_invocation_semantic_source_binding_rejected` retained both source identities but discarded the exact `pipelineResult` whose binding had been rejected. The integrated response retained that judgment, so it could not recover the original rejected pipeline payload.

## Interface/model correction

- The rejected source-binding judgment now retains the exact original `pipelineResult` alongside `controllerSourceFile`, `pipelineSourceFile`, and the rejection reason.
- The source-binding contract advances to version 2 and names rejected-evidence preservation as an invariant. The integrated-response contract advances to version 9, the controller judgment contract to version 4, and the resource invocation integration model to version 3.
- The source-binding authority forwards `input.pipelineResult` unchanged; it does not reconstruct a pipeline payload.
- The integrated response keeps the existing distinct source-binding-rejected outcome and forwards the original rejection judgment without collapsing it into `not_connected`, `blocked`, or `complete`.
- The Laravel controller judgment contract and resource integrated-response model now record the rejected-evidence invariant; the resource model applies it to the same four-outcome response contract consumed downstream.
- No scanner runtime, scanner wiring, subscanner, or `semantic/relations` implementation was changed. No `semantic/foundation` dependency was added.

## Validation

Run `node scripts/audits/audit-phase1871-laravel-invocation-rejected-evidence-preservation-interface-first.cjs`. This audit checks source contracts; it is not TypeScript compilation or a full build.
