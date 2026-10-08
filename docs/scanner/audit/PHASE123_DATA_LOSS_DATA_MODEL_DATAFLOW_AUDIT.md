# Phase 123 — Data-loss audit and model elevation

## Principle
Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.

## Implementation in this phase
Route constraint syntax no longer exposes mutually-exclusive `value` and `values` fields.
It now exposes one explicit `RouteConstraintArgumentAst`:

- `pattern(value)`
- `values(values)`
- `none`

The semantic boundary mirrors this with `RouteConstraintArgument`.

This removes the invalid state where both `value` and `values` can coexist and removes the need for
`undefined` as semantic absence at this boundary.

## Data flow

```text
Laravel where()/whereIn()
        ↓
RouteConstraintArgumentAst
        ↓
RouteConstraintFact.argument
        ↓
RouteConstraintMatcher
        ↓
RouteConstraintContract
        ↓
RouteConstraintFlow
```

No Laravel meaning is selected through ternary control flow. Argument meaning is carried as an ADT datum.

## Audit categories

Audit continues to classify:

- `??`
- full/short ternary
- positional arithmetic such as `i + 123`
- `if` / `switch` / `while`
- `===` / `!==`
- `undefined` / `null`
- open `Record<...>` catalogs
- semantic `as` assertions
- overwrites
- free primitives at semantic boundaries

`if`, `while`, and equality remain legal for generic syntax navigation. They become data-loss findings only
when they encode domain knowledge instead of traversing an already-modeled datum.

## External model evidence

Tree-sitter recommends named fields for accessing children instead of positional assumptions. This supports
keeping cursor arithmetic private to navigation and exposing named AST relations upstream.

Laravel route groups merge middleware and `where` constraints while prefixes and names are appended. That
behavior is a semantic relation/fact and should therefore travel as model data rather than parser branches.

PHP's `??` explicitly represents a null/existence fallback relation. It must survive as an expression datum
when encountered in source syntax.

TypeScript's `if`, loops, ternaries and equality checks are control-flow analysis mechanisms. RouteSync must
not confuse the implementation mechanism with the semantic knowledge being represented.

## Next boundary

The next audit should elevate remaining parser optionality and semantic casts in the route AST, then apply the
same model/data-flow discipline to Model → Property → Expression → Assignment → Eloquent/query.
