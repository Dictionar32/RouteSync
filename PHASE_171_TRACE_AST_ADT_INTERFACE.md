# Phase 171 — Trace AST/ADT Interface

## Focus
Raise query property/operator/literal resolution so semantic meaning is carried by ADTs instead of `undefined` and downstream conditionals.

## Trace finding
`predicateFromArguments()` previously reconstructed three meanings with nullable returns:

- property missing/invalid → `PropertyName | undefined`
- operator missing/invalid → `Operator | undefined`
- operand missing → `Expression | undefined`

That forced downstream composition through `if` checks.

## Interface elevation
Added semantic resolutions in `resourceQueryOperation.ts`:

- `ResourceStringLiteralResolution`
  - `resolved`
  - `not_string`
- `ResourcePropertyResolution`
  - `resolved`
  - `missing`
  - `invalid_value`
- `ResourceComparisonOperatorResolution`
  - `default`
  - `resolved`
  - `invalid_value`
  - `unsupported`
- `ResourcePredicateOperandResolution`
  - `resolved`
  - `missing`

Added matcher functions for each closed ADT.

`ResourceFilterOperationError` now preserves the semantic reason:

- `missing_property`
- `invalid_property_value`
- `invalid_operator_value`
- `unsupported_operator`
- `missing_operand`

## Downstream result
`predicateFromArguments()` now composes the resolution ADTs through matchers. It no longer checks `property === undefined`, `operator === undefined`, or `operand === undefined`.

The resulting `ResourceQueryFilterArgumentsResolution` directly carries either the complete predicate or a semantic error.

## Validation
Command:

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 171.

## Next trace target
The remaining query-boundary reconstruction is concentrated in:

- relation-load list parsing
- argument-count/index selection
- registry lookup fallback

The next elevation should turn those into explicit semantic resolution ADTs, especially replacing `Record<number, number> + ??` for predicate operand position with an operation-specific argument-shape ADT.
