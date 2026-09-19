# Phase 117 — ecommerce_shop → upstream high-level interface model

## Scope

Only the upstream interface/ADT boundary is repaired. No downstream resolver, lowerer, or emitter is changed.

## Trace

`ecommerce_shop source → PHP AST → ResourceFieldExpression → ResourceExpressionModel → ResourceExpressionFieldModel → ResourceBindingModel → downstream`

## Source-driven requirements

The ecommerce_shop resources contain property/nullsafe access, variables, Eloquent method chains, static calls, array access, casts, arithmetic, conditionals, null-coalescing, nested objects, and resource collections. The upstream model therefore cannot expose only `expression + semanticType`.

## Repairs

### 1. Nested response fields are complete

`ResourceExpressionFieldModel` now carries:

- `ResponseFieldName`
- `PropertyName`
- complete `ResourceExpressionModel`

Nested objects are no longer represented by `object([])` while their real children live only in a separate requirement.

### 2. Invalid nested array shapes are explicit

A nested PHP array that is not a static-key object is rejected at the AST boundary instead of throwing or inventing a partial object model.

### 3. Binding model is separated from syntax

Added `ResourceBindingModel` with closed ADTs for:

- root model / variable / resource
- property / relation / method traversal steps
- unresolved / resolved / rejected binding state

This is the high-level interface intended to become the bridge between expression scanning and `BoundSemanticNode`.

## Target examples

`$this->order?->promotion` must carry:

`variable/resource root → property(order, nullsafe) → relation/property(promotion, nullsafe)`

`$query->paginate(15)` must carry:

`variable(query) → method(paginate, direct)`

with its argument model retained by `ResourceExpressionModel`.

## Remaining work

The next upstream-only repair is to construct `ResourceBindingModel` from `ResourceExpressionModel` for actual Laravel patterns, especially:

`$orders → $query → Order::query() → paginate(15)`

and resource property chains such as:

`$this->order?->promotion`.

Only after this interface is populated completely should downstream consume it.
