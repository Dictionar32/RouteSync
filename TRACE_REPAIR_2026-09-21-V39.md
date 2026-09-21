# RouteSync — Trace / Suggestion / Repair v39

## Source boundary

Source evidence is only `examples/ecommerce-shop-source` (111 PHP files). Legacy manifest JSON is not accepted as proof of fresh scanner lineage.

## Tool repair applied

`tools/trace-data-loss-v39.cjs` replaces the coarse V38 source-construct check with a source-aware construct inventory and scoped AST/ADT classification.

The tool now distinguishes:

- `GENERIC_ADT_PRESENT`
- `SPECIALIZED_ADT_PRESENT`
- `TOKEN_ONLY`
- `ADT_NODE_MISSING`
- `UNPROVEN`

A specialized ADT is not treated as a generic AST node.

## Source construct inventory

| Laravel construct | ecommerce-shop evidence | Current representation | Meaning |
|---|---:|---|---|
| Eloquent model property | 39 | `ADT_NODE_MISSING` / token-only extractor | **First upstream blocker** |
| class declaration | 98 | specialized ADTs | Controller/DTO/Route families have scoped ASTs; no generic class AST is claimed |
| method declaration | 217 | `ControllerMethodAst` specialized | Controller methods have scoped AST coverage |
| PHP attribute | 17 | response-attribute specialized ADTs | Scoped response attribute representation exists |
| route declaration | 35 | `RouteDeclarationAst` | Existing specialized route ADT |

## First proven blocker

`packages/core/src/compiler/scanner/subscanners/model/memberPropertiesParser.ts` still extracts Eloquent model properties directly from token descriptors.

The existing semantic owner is already present in `ModelFacts`; therefore the repair must **not** create another model interface.

Required lineage:

`Laravel model property`
→ `canonical PHP property/class-property AST/ADT node`
→ `existing model semantic producer`
→ `ModelFacts`
→ `ModelAst`
→ `CompleteSourceAst`
→ `RouteSyncManifest`

Until the first arrow is represented by the repository AST/ADT, changing `ModelFacts` or `ModelSemanticNode` is blocked.

## High-level upstream model rule

The tool keeps the existing `ModelSemanticNode`, `ResourceSemanticNode`, `RequestSemanticNode`, `ResponseSemanticNode`, and `RouteSemanticNode` as the intended owners. It does not create parallel interfaces.

Current interface-change authorization is fail-closed:

`source -> AST/ADT -> producer -> existing facts owner -> canonical AST`

must be proven before a field can be authorized for interface enrichment.

Nested semantic facts are treated as ownership, not as a reason to duplicate fields at the top level.

## Current trace result

- Status: `UNPROVEN`
- Laravel PHP files: `111`
- Critical: `81`
- High: `7`
- Unproven: `11`
- Missing SourceAsts category: `channels`
- Hidden rescans: `2`
- Pipeline rescans: `6`
- Nested project-root rescans: `10`
- Semantic field loss proven: `0`
- Semantic field mapping unproven: `5`
- Semantic lineage unproven: `5`
- Return type mismatches: `1`
- Delegate mismatches: `4`
- Scanner graph reopen edges: `10`
- Semantic reopen edges: `10`
- Free semantic data sites: `9`

## Repair order

1. Add the missing canonical PHP property/class-property representation to the **existing ADT vocabulary**.
2. Map the current token extraction into that AST/ADT node; do not let the token parser remain the semantic owner.
3. Feed the existing `ModelFacts` producer from the AST/ADT value.
4. Re-run field-level lineage for `$table`, `$primaryKey`, `$keyType`, `$incrementing`, `$fillable`, `$guarded`, `$hidden`, `$appends`.
5. Only after that, connect the existing high-level model at the origin boundary.
6. Then prove `SourceAsts -> CompleteSourceAst -> RouteSyncManifest`.
7. Remove scanner rescans only after the canonical source model carries the required meaning.
8. Remove downstream fallback/free semantic reconstruction after upstream meaning is proven.

## Important non-change

No production semantic interface was widened in v39. The trace proves that the first repair belongs at the PHP AST/ADT boundary, so changing the high-level interface now would move the loss rather than repair its origin.
