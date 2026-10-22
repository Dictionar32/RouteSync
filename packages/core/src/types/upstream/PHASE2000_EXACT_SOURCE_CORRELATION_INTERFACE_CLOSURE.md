# Phase 2000 — Exact Source Correlation Interface Closure

## Trace finding

Phase 1999 introduced `correlateDeclarationSource`, but its input accepted a caller-supplied `identityJudgment` independently of the invocation and declaration evidence. The contract claimed to bind the receipt to the exact source operands, while the type shape did not prevent an unrelated receipt from being supplied. That is an authority gap: a structurally valid judgment is not automatically proof for the source pair in this input.

## Interface correction

`LaravelControllerResponseDeclarationSourceCorrelationInput` now contains only the exact `invocationJudgment` and `declarationEvidence`. The existing `LaravelSourceIdentitySemanticsInterface` is the sole identity owner; the pipeline operation must call `relateSourceFiles(invocationJudgment.sourceFile, declarationEvidence.source.file)` and wrap that returned judgment into the existing success/rejection correlation ADT. No identity algorithm is duplicated and callers cannot inject a detached identity receipt.

The existing `LaravelControllerResponseSemanticPipelineInterface` and its contract are advanced to version 5. This evolves the existing contract rather than adding another pipeline or scanner layer.

## Runtime trace remains open

`packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still does not consume `responseSemanticPipeline`, still creates a response reference candidate from the controller-action descriptor, and still constructs the artifact without `responseJudgment`. This phase intentionally fixes the interface first; it does not claim runtime integration or full typecheck.

## Boundaries

- No `relation/foundation` subscanner was added.
- Existing source identity authority remains canonical.
- Rejected correlation remains a closed ADT outcome and must not reach evidence production.
- The next phase should implement this existing pipeline contract and wire it into the scanner rather than inventing another interface layer.
