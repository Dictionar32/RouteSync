# Phase 466 — scanner query grouping relational cutover

Cut over `queryEvidenceProducer.ts` query grouping from optional sentinel control to `RelationOption`.

Changed:
- `groupingTarget` returns `RelationOption<QueryOrderingTarget>`.
- `queryGroupingFromExpressions` returns `RelationOption<readonly QueryOrderingTarget[]>`.
- `queryGrouping` returns `RelationOption<QueryGrouping>`.
- `groupBy` consumes grouping through `relationOptionFold`.
- Removed the `undefined`/ternary dispatcher from this grouping path.

The source-language PHP vocabulary remains data; only host TypeScript semantic authority is being migrated.

Validation:
- TypeScript compiler was not available in the workspace (`NO_LOCAL_TSC`), so no compile-pass is claimed.
