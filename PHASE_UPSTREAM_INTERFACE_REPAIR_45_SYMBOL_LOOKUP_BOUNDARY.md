# Phase 45 — Symbol Lookup Boundary

## Scope
Whole `packages/core/src` active tree. `packages/core/src/compiler.ts` is legacy and excluded.

## Trace
`semantic/SymbolTable.ts` exposed raw optional lookups:
- `ModelSymbol.column(): ParsedColumn | undefined`
- `ModelSymbol.accessor(): ParsedAccessor | undefined`
- `ModelSymbol.relation(): ParsedRelation | undefined`
- `ModelSymbol.cast(): ParsedCast | undefined`
- `SymbolTable.get(): ModelSymbol | undefined`
- `SymbolTable.getCaseInsensitive(): ModelSymbol | undefined`

These forced consumers to reconstruct lookup absence with truthiness / undefined checks.

## Repair
The active symbol boundary now uses canonical upstream `Lookup<T>`:
- `column(): Lookup<ParsedColumn>`
- `accessor(): Lookup<ParsedAccessor>`
- `relation(): Lookup<ParsedRelation>`
- `cast(): Lookup<ParsedCast>`
- `lookup(): Lookup<ModelSymbol>`
- `lookupCaseInsensitive(): Lookup<ModelSymbol>`

The raw `get/has/getCaseInsensitive` API is no longer canonical.

## Important distinction
This does NOT mean all `if`/`switch` in core are defects. Parser/lexer/formatter/verification state machines retain algorithmic branching. The target is semantic re-classification caused by low interfaces.

## Migration signal
Existing consumers still using the old API are intentionally visible as migration errors. They must be migrated to `Lookup<T>` without reintroducing `undefined`, fallback sentinels, or casts.
