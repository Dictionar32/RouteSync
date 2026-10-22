# Phase 1998 — Declaration Correlation Rejection Is a First-Class Artifact ADT

## Scope

Interface-first correction to the response judgment ADT and scanner artifact. No runtime wiring, response classification, replacement authority, `semantic/relations` subscanner, or `semantic/foundation` subscanner was added.

## Trace

Phase 1997 already modeled declaration/source correlation as a success-or-rejection judgment before evidence production. However, the scanner artifact's `responseJudgment` union admitted only response semantic judgments and per-evidence source-binding rejection. A declaration/source mismatch happens earlier than evidence production, so it had no artifact-compatible response judgment to preserve. That gap could force the runtime to drop the rejection, invent an empty inventory, or incorrectly continue toward AST projection.

## Contract changes

- Added `LaravelControllerResponseEvidenceProductionSourceCorrelationRejectedJudgment`, carrying the exact invocation judgment and the upstream-issued different-source identity receipt.
- Added this rejection to `LaravelControllerAstProjectionResponseJudgment`, so the existing AST projection authority can preserve it as a closed ADT member rather than reconstructing the failure.
- Added the same rejection to every compatible `LaravelControllerScanArtifact` invocation outcome branch.
- Advanced `LaravelControllerScannerInterface` and `LaravelControllerScanJudgment` contract versions from 21 to 22.
- Advanced `LaravelControllerResponseSemanticPipelineInterface` and its contract from version 2 to 3, explicitly requiring declaration-correlation rejection to survive into the artifact and forbidding conversion into empty success.
- Exported the new judgment type from `packages/core/src/index.ts`.

## Intended flow

```text
invocation judgment + declaration source
  → existing source identity judgment
  → ┌ same source: evidence production → evidence binding → response executor → response judgment ┐
    └ different source: explicit correlation-rejected response judgment                           ┘
  → AST/ADT projection preserves the exact compatible outcome
  → controller artifact retains invocation judgment + response judgment
```

The rejected branch is terminal before evidence production. It does not contain a fabricated evidence inventory or response product.

## Runtime trace remains unresolved

`packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` still does not consume `responseSemanticPipeline`, still constructs a descriptor-derived response candidate, and still omits `responseJudgment` when creating the artifact. The implementation's reported contract version remains behind the interface. This phase deliberately does not claim those wiring issues are fixed.

Existing `semantic/relations` references in the legacy controller scanner tree remain; no relation/foundation subscanner was introduced.

## Validation

The accompanying structural audit checks that the rejection type is exported, accepted by the AST projection response ADT and all artifact variants, and documented by the pipeline contract. Syntax checks do not substitute for a full project typecheck/build.
