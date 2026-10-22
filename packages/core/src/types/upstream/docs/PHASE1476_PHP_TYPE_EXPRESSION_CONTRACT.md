# Phase 1476 — PHP Type Expression Contract

## Scope

Strengthen the existing `PhpTypeExpressionInterface` and `phpTypeExpressionAlgebra` contract rather than adding a wrapper around runtime parsing. The algebra owns grammar judgment; `propertyProducer.ts` only projects `resolved` expressions or a closed `TypeExpression` error.

## Contract refinements

- Explicitly parenthesized DNF members are accepted, e.g. `(Customer&Countable)|Invoice`.
- Unparenthesized `Customer|Invoice&Countable` is rejected instead of being silently interpreted as DNF.
- Intersection containing union, e.g. `Customer&(Invoice|Countable)`, fails closed.
- Nullable prefix is restricted to a single atomic type; combinations such as `?Customer|Invoice`, `?Customer&Countable`, and `??Customer` fail closed.
- PHP atoms that currently lack a faithful semantic representation or contextual resolver (`void`, `null`, `true`, `false`, `iterable`, `resource`, `callable`, `self`, `parent`, `static`) fail closed rather than being misclassified as ordinary class references.
- Existing primitive, named/fully qualified, nullable, and array-suffix forms remain supported in the current vocabulary.

## Intentional limits

This does not claim complete PHP grammar coverage. Adding callable signatures, contextual names, literal types, and version-aware legality requires explicit vocabulary and contextual evidence, followed by downstream exhaustive-consumer migration. It is safer to return a malformed judgment than to invent a semantic type.

## Verification

Focused tests are authored in `phpTypeExpressionContract.phase1476.test.ts`. Package build/Vitest execution depends on the workspace having `tsdown` and `vitest` installed. The structural audit is independently runnable with Node.js.
