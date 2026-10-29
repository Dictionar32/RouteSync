# Phase2924 — Route Scanner Inventory Trace

## Scope

This phase migrates the route scanner source-selection boundary from `readonly SourceFile[]` to the existing domain-owned `SourceFileInventory`. It does not introduce a generic collection abstraction and does not modify `collections.ts`.

## Runtime trace

```text
CLI scan/sync or drift audit
  -> LaravelRouteScanInput.sourceSelectionIntent
  -> LaravelRouteDeclarationCompositionAuthority.resolveSourceFiles
  -> SourceFileInventory
  -> filter(fs.existsSync inverse)
  -> observeSourceFiles(intent, selected inventory, missing inventory)
  -> ready source observations OR explicit-source blocked judgment
  -> inventory visitor schedules source reads
  -> route declaration composition
  -> scan outcome / CLI manifest composition
```

## Contract changes

- `resolveSourceFiles` returns `SourceFileInventory`.
- `LaravelRouteSourceObservationInput.selectedFiles` and `.missingFiles` use `SourceFileInventory`.
- `LaravelRouteScanBlockedJudgment.missingFiles` preserves missing-file evidence as `SourceFileInventory`.
- Scanner wiring uses `visitSources` to schedule reads, preserving inventory order and concurrent read execution.
- Default route files are assembled through the existing inventory contract.
- Explicit missing files still produce `laravel_route_scan_blocked`; missing default files remain optional absence observations.
- The route scanner contract version advances from 36 to 37.

## Remaining reasoning

The composition authority still distinguishes default and explicit intent using a `switch`, and the scanner wiring still branches on the blocked observation. This phase deliberately does not claim that all primitive reasoning has been eliminated. A later change should move those follow-up decisions into a domain-specific selection/observation ADT without making `core` depend on CLI settlement types.

## Validation boundary

The Phase2924 audit script checks source-level contract shape and traced call sites. Syntax checks are not a substitute for project typecheck, build, unit tests, or CLI E2E.
