# Phase 153 — Trace AST → ADT → Binding Interface

## Trace

`ecommerce_shop → PHP AST → ResourceFieldExpression → ResourceExpressionModel → ResourceBindingOrigin/Provenance → Traversal`

## Finding

`resourceBindingOriginResolver` classified every `ResourceExpressionModel` whose semantic state was not `requires_binding` as `rejected: unsupported_expression`.

That was semantically too broad. A known literal/scalar expression is valid semantic data; it simply has no binding origin.

`resourceBindingProvenanceBuilder` had the same collapse: every non-binding expression became `rejected: unsupported_expression`.

This mixed two different meanings:

- valid expression with no binding origin
- structurally unsupported expression

## Interface elevation

Existing interfaces were elevated; no parallel interface was introduced.

### ResourceBindingOriginState

Valid non-binding expressions now become:

`unresolved → unknown → no_binding_origin`

rather than:

`rejected → unsupported_expression`

### ResourceBindingProvenance

A valid non-binding expression now produces a `complete` provenance node with:

`origin = expression / non_variable_root`

rather than a rejected provenance.

## Consequence

Downstream can distinguish:

```text
valid semantic expression
    → no binding origin

invalid/cyclic binding graph
    → rejected
```

It no longer needs an `if`/ternary/switch to infer whether `unsupported_expression` means “valid but non-bindable” or “actually unsupported”.

## Additional cleanup

The redundant `$this` rejection branch inside `resolveVariable` was removed. `$this` is resolved at the variable requirement boundary as `controller_this`.

## Validation

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the existing environment blocker:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript error was introduced by Phase 153.

## Next trace target

The next semantic gap is the duplicated `switch`/fallback interpretation in `resourceBindingTraversalBuilder.ts`, especially:

- `nextState(ResourceMethodResult)`
- `traversalTarget(ResourceMethodResult)`
- scalar UNKNOWN fallback for `value_collection`, `unsupported`, and `unresolved`

The next elevation should make `ResourceMethodResult` expose a canonical traversal projection once, so traversal does not classify the same result twice.
