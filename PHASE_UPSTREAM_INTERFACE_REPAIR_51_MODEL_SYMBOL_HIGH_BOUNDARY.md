# PHASE UPSTREAM INTERFACE REPAIR 51 — Model Symbol High Boundary

## Scope
- Entire `packages/core/src` active tree.
- `packages/core/src/compiler.ts` is legacy and explicitly excluded.
- Interface-first repair; compiler migration errors are not treated as reasons to weaken the upstream model.

## Trace
The model semantic resolver was still reconstructing a model column from two independent symbol collections:

```text
ModelSymbol
├── columnsByName: ParsedColumn
└── castsByName: ParsedCast
        ↓
consumer
├── column lookup
├── cast lookup
└── combine effective type
```

The canonical upstream fact already correlates these meanings:

```text
ModelColumnFact
└── type
    ├── native
    └── casted
```

## Repair
`packages/core/src/semantic/SymbolTable.ts`:
- Removed low-level `ParsedColumn` storage from `ModelSymbol`.
- Removed low-level `ParsedCast` storage from `ModelSymbol`.
- Removed `column()` and `cast()` symbol APIs.
- Added canonical `columnFact(name): Lookup<ModelColumnFact>`.
- `ModelSymbol` now obtains column semantic meaning from `ModelNode.columnFacts`.

`packages/core/src/semantic/plugins/ModelColumnResolver.ts`:
- No longer performs column lookup followed by cast lookup.
- No longer calls `mapCastToTs()` to reconstruct effective column type.
- Consumes `ModelColumnFact` directly.
- Cast information is read only from correlated `fact.type`.
- Bound semantic output is built from the same fact.

## Resulting flow
```text
ModelScanner
  ↓
ModelColumnFact
  ↓
ModelNode.columnFacts
  ↓
ModelSymbol.columnFact()
  ↓
ModelColumnResolver
```

There is no longer a semantic join of `ParsedColumn + ParsedCast` inside the active model symbol/resolver boundary.

## Verification
Narrow TypeScript compilation produced no diagnostics from:
- `semantic/SymbolTable.ts`
- `semantic/plugins/ModelColumnResolver.ts`
- `modelColumn*` files

The repository still has unrelated migration diagnostics elsewhere; they are intentionally not solved by weakening this interface.

## Remaining trace
Low-level `ParsedColumn` / `ParsedCast` still exist in scanner/source compatibility structures. The next task is to determine which are genuine source AST evidence and which are semantic leakage. Do not blindly delete them.
