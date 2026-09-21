# RouteSync — Trace / Suggestion / Repair v15

## Source of truth
Laravel `examples/ecommerce-shop-source` is the only source evidence. Legacy manifest JSON is rejected as evidence.

## Repair applied
`pipelineScanner.ts` now consumes the existing validated upstream boundary:

`scanRouteSyncManifest(projectRoot) -> CompleteSourceAst -> SourceAsts.models`

The existing `ModelSymbolTable` is built directly from the upstream `ModelAst` sequence. The previous independent `ModelScanner.scan(projectRoot)` call was removed.

No new production interface was introduced.

## v15 trace result
- Producer chain: 7/7 proven
- Laravel PHP files: 111
- SourceAst symbol uses: 2 (assignment + actual model consumption)
- Canonical category producers: 7 (expected source-category construction, not defects)
- Legacy scanner rescans after canonical AST: 5 proven
- Free-data boundaries: 6 risk sites
- Duplicate Nullability vocabularies: 2
- downstream isNullable calls: 16 candidates
- split semantic authority: 5 candidates
- upstream projection candidates: 199 (candidate only)
- targeted ternary: 1
- ternary fallback/reclassification: 10
- manifest boundary fields: 12

## Remaining first blocker
Five scanners still take `projectRoot` after the canonical SourceAsts boundary exists:
- FormRequestScanner.scan
- ControllerScanner.scan
- ResourceScanner.scan
- RouteScanner.scan
- ChannelScanner.scan

These are the next repair targets. They must consume existing upstream AST/ADT data rather than introduce another source scan. No parallel interface should be created.

## Ternary
The previous concrete ternary loss was repaired at `bindTernaryField`: condition AST is preserved, the complete ternary expression is retained, and both verified branch types are joined. `conditionLoss=0` in v15 is detector confirmation only, not proof of total semantic completeness.

## Validation limitation
Repository TypeScript validation cannot currently run to completion because this runtime lacks `@types/node` and `vitest/globals` type definitions. This is an environment/dependency limitation, not a claim that the modified tree is compile-green.
