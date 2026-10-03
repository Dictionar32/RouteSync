# Phase 121 — Data-loss-free Data Model / Data-flow Audit

## Principle

> Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

Control flow (`if`, `while`, `switch`) is allowed only when it is generic traversal or parser mechanics. Laravel meaning must exist as typed data: facts, ADTs, catalogs, policies, relations and data-flow edges.

## Audit scope

`packages/core/src/compiler/scanner/lexer/routeAst`, route semantic adapters, and upstream route ADTs.

## Findings from Phase 119 checkpoint

- `??`: 0 in `routeAst`.
- actual ternary expressions: 0 in the Phase 119 syntax-model audit; `?` occurrences also include optional chaining/route syntax and must not be misclassified as ternary.
- `switch`: 0 in `routeAst`.
- `indexOf` / `findIndex`: 0 in `routeAst`.
- raw positional arithmetic remains only in navigation primitives; it must not cross into semantic meaning.
- `undefined` remains heavily present at syntax/navigation boundaries. This is the main next elevation target.
- `Record<...>` remains in catalogs. Catalogs are data, but open `Record` typing should be replaced progressively by closed catalog ADTs where the domain vocabulary is known.
- `as` assertions remain in constructors and compatibility/test code. These are evidence-boundary targets, not reasons to introduce more parser branches.

## Data-loss categories

| Pattern | Correct model |
|---|---|
| `??` | expression + presence/fallback relation |
| ternary | expression ADT with explicit branches |
| `i + 123` / `i - 123` | named navigation relation |
| semantic `if/switch` | strategy/catalog/fact ADT |
| `undefined` absence | `Presence<T>` |
| source `null` | explicit null-literal expression datum |
| `Record<string,T>` | closed vocabulary/catalog model |
| `as T` | typed constructor/refinement carrying evidence |
| overwrite | append-only fact/data-flow relation |
| free primitive | typed value object / domain ADT |

## Data-flow elevation

Laravel routing exposes information that must remain relational. Laravel documents that nested route groups merge middleware and `where` constraints while appending names and prefixes. Resource routes also expose middleware for all actions and for selected/excluded actions. These are therefore modeled as facts and composition relations, not branch-local parser state. citeturn0search4turn0search11

Tree-sitter likewise exposes named nodes and named fields specifically so analysis can address syntax by semantic field rather than child position. This validates keeping positional arithmetic inside navigation and keeping meaning in the AST/model layer. citeturn0search0turn0search3turn0search6

TypeScript's own narrowing is control-flow analysis: `if`, equality checks, loops, and conditional expressions refine types along execution paths. RouteSync must not use that runtime-style mechanism as its semantic representation; its semantic knowledge should be materialized first as ADT/fact data. citeturn0search1turn0search5

## Implemented model

`dataModelAudit.ts` introduces:

- `DataLossKind`
- `ModelBoundary`
- `DataLossRule`
- `DataLossFinding`
- `DataFlowDatum`
- `DataModelAuditReport`
- declarative `DATA_LOSS_RULES`
- `auditSourceText(...)`
- `buildDataModelAuditReport(...)`
- `routeDataFlowModel`

The audit rules are data. Adding a new data-loss class therefore does not require adding a semantic parser branch.

## Next elevation order

1. `undefined` → `Presence<T>` at AST boundaries.
2. Route constraint `value/values` → mutually exclusive value ADT instead of parallel optional fields.
3. `Record` catalogs → closed catalog types where the vocabulary is finite.
4. `as` assertions → constructors/refinements that carry source evidence.
5. Route/resource AST → explicit `DataFlowDatum` provenance.
6. Apply the same model to Model → Property → Expression → Assignment → Eloquent/query flow.

## Important distinction

`while` in a token cursor is not automatically data loss. It is navigation mechanics. `if` that checks a Laravel method and decides a semantic value is data loss risk. The audit therefore classifies patterns by **boundary and role**, not by keyword alone.
