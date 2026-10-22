# Phase 1847 — Resource Model Fixed-Point Interface

## Trace

Phase 1846 propagated direct child-resource conventions, but the authority evaluated each resource independently. A child resource bound by controller-return evidence could not inform a parent resource's relation judgment unless the child model also matched naming convention.

## Interface-first change

- Added `ResourceModelBindingBatchJudgmentInput`, which carries the complete resource-subject set, canonical model definitions, the complete `LaravelControllerScanJudgment`, and source-backed relation evidence.
- Added `ResourceModelBindingBatchJudgment` and a typed fixed-point closure receipt.
- Added `judgeBatch` to the existing `ResourceModelBindingJudgmentAuthority`; no duplicate authority interface was introduced.
- Advanced the resource scanner and semantic judgment contract versions to 6.

## Authority behavior

The authority now evaluates all resource subjects together. Relation propagation can use resolved or ambiguous child judgments from prior closure rounds. It repeats until the judgment set stabilizes. If a relation cycle oscillates instead of converging, the authority conservatively returns explicit unresolved relation-binding judgments rather than guessing a model.

## Runtime boundary

`laravelResourceScanner` collects source evidence, invokes `judgeBatch` once, then projects only resolved model judgments into resource ASTs. The scanner does not perform relation propagation or model selection. The resulting `LaravelResourceScanJudgment` preserves the closure receipt alongside resolved, rejected, and per-resource binding judgments.

The controller scan object remains whole and source-correlated, preserving the integrated invocation semantic judgment through the resource authority boundary. No `semantic/foundation` dependency was introduced.

## Verification

Static audit checks are registered under `scripts/audits/`. Build, typecheck, and E2E were not run, per the established workflow constraint.
