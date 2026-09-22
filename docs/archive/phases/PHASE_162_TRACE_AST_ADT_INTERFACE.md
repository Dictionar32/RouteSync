# Phase 162 — Trace AST → ADT → Projection Interface

## Trace

`ResourceModelMethodResolverOperation.projectionFromArguments()` previously classified each expression with an inline ternary:

`literal string -> property`, `otherwise -> raw`.

The resolver therefore inspected expression syntax while constructing semantic query projections.

## Interface elevation

The existing canonical `ResourceQueryProjection` ADT remains the semantic SSOT:

- `property(PropertyName)`
- `raw(ResourceExpressionModel)`

No parallel scanner interface was introduced.

`ResourceLiteralValue` was elevated with a closed `ResourceLiteralValueVisitor` and `matchResourceLiteralValue()` algebra. Projection resolution now uses the existing `matchResourceExpression()` algebra and delegates literal meaning to the literal algebra.

Flow:

`ResourceExpressionModel -> ResourceFieldExpression ADT -> literal algebra -> ResourceQueryProjection -> downstream`

The projection resolver no longer contains a ternary/switch for deciding `property` vs `raw`.

## Result

Downstream receives an explicit projection meaning. It does not inspect literal syntax to reconstruct whether an argument represents a property name or a raw expression.

The centralized `switch` remains inside the closed ADT algebra (`matchResourceLiteralValue` / existing `matchResourceExpression`). This is origin algebra dispatch, not downstream re-classification.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the pre-existing environment blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by Phase 162.

## Next semantic gap

`ordering` still contains inline nested ternary selection between property/raw/invalid. The next elevation should reuse the same projection ADT pattern for `ResourceQueryOrderingTarget`, so ordering meaning is also complete before the resolver.
