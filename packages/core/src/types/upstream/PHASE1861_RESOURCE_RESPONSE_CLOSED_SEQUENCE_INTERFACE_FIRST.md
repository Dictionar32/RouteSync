# Phase 1861 — Resource Response Closed Sequence

## Trace finding

`LaravelResourceScanJudgment` exposed three parallel arrays (`resources`, `rejected`, and `modelBindingJudgments`). That representation permits source-correlation drift and contradicts the existing semantic invariant that scan products are paired per source subject rather than carried in parallel arrays.

## Interface-first change

The final judgment now exposes one named `LaravelResourceScanArtifactSequence`. Its recursive `Sequence<LaravelResourceScanArtifact>` preserves source order, and each discriminated artifact carries its own `modelBinding` judgment. Resolved and rejected outcomes therefore remain paired instead of requiring index-based correlation across independent arrays.

The exact upstream `controllerScan` and the closed `bindingClosure` remain part of the judgment. `LaravelResourceIntegratedResponseContract.responseShape` makes the paired sequence requirement explicit. The source-AST pipeline converts the semantic sequence only at the downstream AST projection boundary.

## Deliberate limits

- This phase removes parallel arrays from the final resource-scan judgment; it does not claim that every internal source-evidence or authority input has ceased using arrays.
- `resourceProducer` remains in place because it is still called by the production projection path.
- Runtime semantic derivation in `resourceModelBindingAuthority.ts` remains a separate next-stage issue.
- No build or TypeScript typecheck is claimed.
