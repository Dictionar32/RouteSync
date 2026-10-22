# Phase 1864 — Resource Binding Subject Judgment, Interface First

## Trace

The Laravel resource scanner previously consumed `bindingBatch.judgments[index]`. That made source-to-judgment correspondence depend on two arrays preserving the same order. The batch contract in `laravelScannerSemanticJudgment.ts` exposed detached judgments and did not carry an explicit subject-judgment pair.

The controller side already retains each `LaravelControllerInvocationSemanticJudgmentInterface` on its source-correlated `LaravelControllerScanArtifact`. Its `response` is the exact `PhpSourceInvocationSemanticPipelineIntegrationResult`. The resource scanner must retain that complete controller scan rather than rebuild invocation information.

## Interface-first changes

1. Added `ResourceModelBindingSubjectJudgment`, pairing the exact `ResourceModelBindingSubject` object with its `ResourceModelBindingJudgment`.
2. Changed `ResourceModelBindingBatchJudgment` to contract version 2 and `bindings`; it no longer publishes a detached `judgments` array.
3. Strengthened `ResourceModelBindingJudgmentAuthority` with an explicit contract version and subject-correspondence ownership.
4. Advanced `ResourceModelBindingSemanticJudgmentModelInterface` to version 3. Its batch contract now states that downstream correspondence uses subject identity, and its integrated-response contract preserves the exact controller artifact's invocation response without reconstruction.
5. Added `LaravelResourceIntegratedResponse`, a single aggregate containing the exact `LaravelControllerScanJudgment`, completed binding closure, and source-ordered resource artifacts. `LaravelResourceScanJudgment` now exposes that aggregate through `response` instead of detached fields.
6. Updated the Laravel scanner to find the binding by the exact subject object rather than `judgments[index]`. It projects AST only after the binding batch has been closed.
7. Updated `laravelSourceAstPipeline.ts` to consume `resourceScan.response.artifacts` and exported the new upstream response and subject-judgment contracts.

## Ownership boundary

- Source evidence creation remains in the scanner's source adapter.
- Resource/model candidate derivation and fixed-point judgment remain owned by `resourceModelBindingAuthority`, which executes the upstream semantic rule set.
- The scanner does not choose or reconstruct binding meaning. It consumes the authority's subject-correlated closed judgment and performs AST projection.
- Invocation semantics remain inside each controller artifact's exact integrated invocation judgment; the resource response preserves the exact controller scan object.

## Audit

- `audit-phase1862-resource-authority-composition-interface-first.cjs`: 7/7 passed.
- `audit-phase1864-resource-binding-subject-judgment-interface-first.cjs`: 9/9 passed.
- Full package build/typecheck was not run in this environment.

## Next interface-first target

The remaining semantic work is inside `resourceModelBindingAuthority.ts`: candidate/provenance fact construction, outcome formation, and fixed-point/cycle closure are still executable authority logic. The next phase should strengthen the existing upstream semantic rule/closure model to own these judgments before simplifying the authority executor; merely moving those functions to another file would not complete the migration.
