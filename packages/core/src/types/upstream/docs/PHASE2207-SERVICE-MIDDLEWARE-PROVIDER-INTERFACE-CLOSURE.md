# Phase 2207 — Service, Middleware, Provider Interface Closure

## Goal

Make service, middleware, and provider acquisition explicit dependencies of the existing `LaravelSourceAstPipelineInterface`, without introducing a new relation/foundation/subscanner layer or a second semantic authority.

## Changes

- Added `LaravelServiceScannerInterface`, `LaravelMiddlewareScannerInterface`, and `LaravelProviderScannerInterface` under `types/upstream` and exported them from the upstream barrel.
- Extended `LaravelSourceAstPipelineDependenciesInterface` and incremented its contract version from 8 to 9.
- Replaced direct calls in the pipeline executor with calls through the selected scanner dependencies.
- Service and provider judgments expose source-correlated artifacts, retaining each AST with its semantic definition instead of requiring downstream index-based pairing.
- Kept the existing invocation inventory receipt, controller scanner, response scanner, response projection judgments, and integrated response pipeline as their existing authorities.
- Added a Phase 2207 contract test.

## Explicit remaining gaps

- The canonical composition root still adapts legacy implementations in `compiler/scanner/subscanners`; this phase closes dependency selection but does not retire those implementations.
- `ChannelScanner.scanCanonicalAsts` is still called directly. The existing `LaravelChannelScannerInterface` is not a drop-in replacement because it requires source subscription evidence and a classification authority; adapting it must preserve unresolved and ambiguous channel judgments instead of flattening them into `ChannelAst[]`.
- The executor still imports `semantic/relations` helpers for sequence construction, uniqueness, and resource judgment projection. This phase does not claim the pipeline is relation-free.
- Channel dependency closure, other direct scanner dependencies, and relation helper retirement remain open.

## Validation boundary

Syntax transpilation and structural checks are recorded in `PHASE2207_SERVICE_MIDDLEWARE_PROVIDER_INTERFACE_CLOSURE_AUDIT.json`. Full typecheck, Vitest, and package build are not claimed unless run separately.
