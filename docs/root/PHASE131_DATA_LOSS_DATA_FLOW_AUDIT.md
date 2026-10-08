# Phase 131 — Data Loss / Data Flow Audit

## Scope

Audited the Route AST pipeline for loss-prone fallback semantics and knowledge encoded as control flow:
`??`, null, `Record`, ternary, `if`, `switch`, `while`, positional arithmetic, numeric indexing, `===/!==`, and optional/undefined boundaries.

External architecture references checked:
- Tree-sitter grammar fields and named syntax nodes: field-based access is explicitly supported to avoid positional child knowledge.
- Tree-sitter static node types: syntax-node fields expose required/multiple structure as data.
- Laravel 13 routing: nested route groups merge middleware and `where` constraints; route parameters, resource/controller targets, binding scopes and missing behavior are distinct routing semantics.

## Implemented

### 1. Call-boundary Presence
`TokenCursor.callCloseCursor` and `afterCallCursor` no longer fall back to the current cursor when the boundary is absent.

Before:
- missing close → current cursor
- missing after-call boundary → current cursor

After:
- `callClosePresence` / `afterCallPresence` preserve `absent` explicitly
- cursor convenience access returns `undefined` rather than inventing a position
- consumers guard the missing boundary or use the explicit statement boundary model

This prevents malformed/incomplete calls from being interpreted as valid zero-width ranges.

### 2. Argument Cardinality
`callArgumentSpans` no longer exposes an API that silently maps an absent call to `[]`.

The authoritative relation is now `callArgumentSpansPresence`:
- `absent` = call/closing structure unavailable
- `present([])` = structurally valid call with no top-level argument spans
- `present(spans)` = arguments preserved

Resource/group syntax consumers read the Presence relation before collecting values.

### 3. Route target ADT
Route target fallback remains explicit `unsupported`; unsupported expressions are never converted into `closure`.

The target model retains:
- controller action
- invokable controller
- closure variant
- unsupported + reason

This prevents semantic fabrication at the AST boundary.

### 4. Data-flow preservation
Existing data-flow remains source → syntax fact → semantic fact → consumer, with cardinality and provenance. Empty collections are not used as a substitute for absent facts.

## Audit classification

| Pattern | Result | Classification |
|---|---:|---|
| `??` | 0 | eliminated from audited Route AST layer |
| `null` literal | 0 | eliminated from audited Route AST layer |
| `Record` | 0 | finite knowledge represented by catalogs/ADTs |
| `switch` | 0 | syntax/semantic knowledge represented by model dispatch |
| `indexOf/findIndex` | 0 | no positional search API |
| numeric `[0]/[1]` | 0 | named relations/cursors |
| positional `+1/+2/+123` | 3 | confined to TokenCursor primitive navigation (`next`, `afterNext`, `advance`) |
| `while` | 16 | traversal/execution mechanisms only |
| `if` | 49 | remaining parser/traversal guards; not finite Laravel vocabulary catalogs |
| `===/!==` | 125 | structural token predicates/type guards; candidate for future predicate-catalog elevation, but not data-loss by itself |

The numeric positional arithmetic count is intentionally non-zero only inside the primitive navigation abstraction. It is not duplicated in semantic/parser code.

## Validation

- Route AST TypeScript transpilation: **11/11 files, 0 diagnostics**.
- No `??`, `null`, `Record`, `switch`, `indexOf`, `findIndex`, or numeric `[0]/[1]` in the audited Route AST tree.
- Remaining `if`/`while` are execution/traversal mechanics; domain vocabulary remains catalog/ADT data.

## Architectural alignment

Tree-sitter documents named fields as a way to access children by semantic names rather than ordered positions. Its static node-type model also describes fields as structured required/multiple data. Laravel routing documents route-group merge behavior and distinct route features such as constraints, bindings, controllers, and missing handlers. The implementation therefore keeps syntax navigation and Laravel knowledge as data models and lets traversal consume those models.
