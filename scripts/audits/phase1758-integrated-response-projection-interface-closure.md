# Phase 1758 — Integrated Response Projection Interface Closure

## Trace finding

`ControllerDataflowAst` exposed the integrated composition result and the analysis projection as two independent fields. Although the test asserted that their response references matched, the interface allowed consumers to construct a mismatched pair. The scanner also invoked projection as a second operation after composition, leaving correlation dependent on wiring discipline.

## Interface-first correction

- Bumped `InvocationSemanticIntegratedResponseCompositionContract` to version 6.
- Made `InvocationSemanticIntegratedResponseCompositionResult` carry both the exact publication response and its upstream-created `analysisProjection`.
- Moved projection creation into upstream composition via one exhaustive projector; the exported projection interface delegates to the same implementation.
- Removed the separate projection field from `ControllerDataflowAst`.
- Simplified `controllerDataflowAnalyzer.ts` to call `integrate()` once and return the correlated result without interpreting publication state.
- Updated scanner regression assertions to read projection through the composition result.

## Architecture

`Source knowledge → invocation pipeline → publication authority → integrated response + correlated projection → Laravel scanner`

The scanner no longer creates or pairs these artifacts. This closes the interface-level mismatch possibility rather than merely testing that wiring happens to pair the same response.

## Validation boundary

Source-level assertions and ZIP integrity are checked during packaging. TypeScript typecheck, Vitest, and full build are not run in this environment; do not infer that they pass. Resource expression mapping still has direct imports from `subscanners/resource/resourceUpstreamExpressionCanonical.ts`; subscanner retirement remains open and must be addressed by establishing the PHP-AST-to-upstream-expression contract before consumer migration.
