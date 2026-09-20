# Phase 47 — Model Scanner Origin Boundary

## Scope
Whole `packages/core/src` active scope; `packages/core/src/compiler.ts` is legacy and excluded.

## Root traced
`ModelScanner → parseModelFile → ScannedModelDescriptor → modelAstFromParsed` still reconstructed the correlation between model columns and casts downstream in `modelCanonical.ts`, and `ScannedModelDescriptor` independently searched casts by property.

## Repair
- Added canonical `ParsedModel.columnFacts: readonly ModelColumnFact[]`.
- Added `ScannedModelParams.columnFacts` and preserved existing `columns`, `casts`, `accessors`, and `relations` so source data is not lost.
- `parseModelFile()` now creates `ModelColumnFact` at the scanner origin boundary and receives the real source file path from `ModelScanner`.
- Added `modelColumnFactsCanonical.ts` as the single producer for correlated column/cast facts.
- `modelCanonical.ts` now consumes `model.columnFacts`; it no longer constructs a second `castsByProperty` join.
- `ModelAst.schema.columns` therefore receives already-correlated `ModelColumnFact` data.

## SSOT
`ModelColumnFact` remains canonical in `types/upstream/modelSourceFacts.ts`.
No duplicate `ModelColumnFact` type was introduced.

## Migration signal
`ScannedModelDescriptor` still contains a legacy `params.casts.find(...)` projection for `ParsedColumn.semanticType`. This is now the next producer/compatibility boundary to trace; it was not hidden with `as`, `any`, `null`, `undefined`, or fallback logic.

## Verification
Targeted TypeScript audit shows no new errors from `modelParser.ts`, `modelColumnFactsCanonical.ts`, `modelCanonical.ts`, or the new `columnFacts` interface. Existing unrelated migration errors remain.

## Principle
Do not make downstream infer `column + cast → effective type`. The scanner now emits the correlated fact once at the origin boundary.
