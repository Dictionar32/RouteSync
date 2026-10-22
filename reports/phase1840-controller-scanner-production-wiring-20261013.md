# Phase 1840 — Controller Scanner Production Wiring

## Interface-first changes

- Wired the existing `laravelControllerScanner` implementation into `laravelSourceAstPipeline.ts`.
- Controller ASTs and action flow contracts now originate from `LaravelControllerScanJudgment` artifacts, rather than the output arrays returned by the legacy controller scanner.
- `SourceAsts` now retains the complete `controllerScan` judgment alongside the exact authority-closed invocation inventory receipt.
- Per-controller actions are projected from `controllerProducer.produce(...).actions`, preserving the canonical `ControllerActionFlowContract` shape.

## Remaining migration boundary

`ControllerScanner.scanCanonicalBundle()` remains temporarily called only because current route/resource subscanners still require its legacy `controllerIndex` and resource-dataflow projection. This phase does not claim subscanner retirement and does not claim route/resource migration. Removing this call before their contracts are wired would remove inputs that those consumers still require.

## Verification

Static audit only. Build, TypeScript typecheck, and end-to-end tests were not run.
