# Phase 2218 — Canonical Action Method Source Correlation

## Root cause

The action judgment retained the exact controller invocation judgment and source file, but did not publish the selected method's exact source span as part of its canonical semantic knowledge. The action publication therefore carried a controller file identity without a canonical method span. This weakened the already-declared rule that response compatibility products must be correlated to exact method evidence and source span.

## Change

- Evolved the existing `LaravelControllerActionSemanticJudgmentInput` with `methodSource: SourceSpan`.
- Evolved the existing canonical `LaravelControllerActionSemanticKnowledge` with `source: SourceSpan`.
- The Laravel controller scanner projects the method parser's exact start/end offsets into a source span using the invocation judgment's source file.
- The existing action judgment adapter preserves that exact span as `semantic.source`.
- `ControllerActionJudgmentPublication` now carries the same source span from the canonical judgment, not a controller-wide approximation.
- The action judgment contract version is now 25 and declares the method-source correlation invariant.

No new authority, relation/foundation layer, or subscanner was added. The existing `scanControllerAction` / `resolveControllerActionContract` derivation path remains open and is not represented as retired.

## Trace

`ControllerMethodAst.source` → `LaravelControllerScannerExecutor` creates `methodSource` → existing `actionJudgment.judge` receives it → canonical `semantic.source` preserves it → `ControllerActionJudgmentPublication.source` exposes the same value to downstream consumers.

The invocation judgment continues to retain its own source identity and ADT outcome. The method span is a distinct, narrower source-correlated fact; it does not replace or reinterpret the invocation judgment.

## Remaining gaps

- `scanControllerAction` and `resolveControllerActionContract` still derive legacy body/response projection products.
- The response pipeline's DTO declaration and `ResponseContract` products still need action-level compatibility projection and parity evidence before the legacy descriptor resolver can be retired.
- Resource-binding domain publication still passes through the existing action adapter.
- Channel subscription evidence and `semantic/relations` call sites remain open audit items.

## Validation

- Changed/new TypeScript files transpile without syntax diagnostics.
- Structural regression test added for method-span preservation across interface, scanner wiring, and action publication.
- Full typecheck, Vitest suite, and package build were not run.
