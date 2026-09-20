# Phase 190 — Trace Member Path Upstream

## Flow

ecommerce_shop → PHP scanner AST → ResourceScanner → upstream Expression → semantic/domain → downstream

## Finding

Scanner AST already carried `PhpPropertyPath`, but the upstream expression mapper discarded it. Property/method expressions only retained the receiver and final member name. Downstream could therefore need to reconstruct a chain from nested receivers.

## Repair

Existing upstream `Expression` member variants now carry `PropertyPath`:

- `property`
- `nullsafe_property`
- `method`
- `nullsafe_method`

The scanner bridge maps the existing `PhpPropertyPath` directly into the upstream `PropertyPath`.

No parallel interface was introduced. The existing expression ADT was elevated.

## Invariant

```text
PhpPropertyPath
    ↓
ResourceScanner bridge
    ↓
Expression.path
    ↓
semantic/domain
    ↓
consumer reads path directly
```

The consumer no longer needs to infer a chain by walking/reconstructing receiver syntax.

## Branching rule

`matchPhpAccessMode` remains the centralized ADT elimination at the scanner origin boundary. It selects the already-known `direct` / `nullsafe` meaning. No downstream re-classification was added.

## Verification

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the existing blocker remains:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors were introduced by this phase.

## Next trace target

Trace the resource property-path binder against the new upstream path. The goal is to determine whether `fieldBinder` still re-classifies `target.steps.length` and `whenLoaded` instead of receiving an upstream semantic member classification.
