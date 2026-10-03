# Phase 404 — Scanner Relational Disjunction

Phase 404 continues the scanner/lexer authority migration after Phase 403.

## Architectural change

The canonical semantic kernel now exposes `relationAny`, a recursive relation over boolean predicates. Scanner/resolver code can express disjunction as a relation rather than host-language `||`.

`controllerMethodParser.ts` was migrated so its control predicates use `relationGate`, `relationAny`, and `relationEqual`. Equality is represented by the canonical relation rather than `===`.

## Target audit

`packages/core/src/compiler/scanner/lexer/controllerMethodParser.ts`

Forbidden forms checked: `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`.

Result: 0 exact lexical matches.

## Validation

Repository-wide TypeScript checking remains environment-blocked because the workspace does not provide `node` and `vitest/globals` type definitions. This phase does not claim repository-wide type-clean status.
