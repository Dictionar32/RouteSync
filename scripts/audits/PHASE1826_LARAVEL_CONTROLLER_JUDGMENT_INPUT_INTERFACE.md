# Phase 1826 — Laravel Controller Judgment-Input Interface

## Objective

Close the production-boundary interface before any wiring migration. The controller scanner must consume an already integrated upstream invocation judgment, not raw pipeline results and not a callable authority that lets the scanner construct semantic judgments.

## Trace findings

- Phase 1825's interface injected `LaravelControllerInvocationSemanticJudgmentAuthorityInterface` while its boundary contract also said scanner runtime performs no semantic judgment construction. Those statements conflicted.
- Its delivery ADT carried raw `PhpSourceInvocationSemanticPipelineResult`, meaning judgment construction still occurred at the scanner boundary.
- The previous boundary contract's interface and constant were also out of alignment: several required literal fields were missing or used a different `scannerOutput` literal. This is corrected in this phase.
- Production still invokes `ControllerScanner.scanCanonicalBundle()` in `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`; route and resource consumers still rely on legacy controller-index data.

## Interface changes

- Raise `LaravelControllerScannerInterface` and `LaravelControllerScanJudgment` to contract version 5.
- Remove `invocationJudgmentAuthority` from the scanner interface.
- Replace raw pipeline delivery ADTs with `invocationJudgments: readonly LaravelControllerInvocationSemanticJudgmentInterface[]`.
- Remove the raw `PhpSourceInvocationSemanticPipelineResult` scanner input and obsolete delivery exports.
- Keep source identity and integrated response together inside the upstream judgment.
- Raise `LaravelControllerInvocationSemanticBoundaryContract` to version 41.
- Align every contract interface field with the exported contract constant, including the previously missing fields.

## Scope and status

This phase changes interfaces and audit coverage only. It does not migrate production wiring or delete `ControllerScanner`; those steps must follow after the upstream source inventory is made to provide one authority-closed judgment per controller source and consumers are migrated.

No build, typecheck, or E2E was run.

## Audit

Run `node scripts/audits/audit-phase1826-laravel-controller-judgment-input-interface.cjs`.
