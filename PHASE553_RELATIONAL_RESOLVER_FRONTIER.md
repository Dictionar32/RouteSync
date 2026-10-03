# Phase 553 — Relational Resolver Frontier

## Objective

Close the remaining host-language control leakage in the scanner/lexer + generic constraint solver + semantic type resolver frontier, while preserving PHP `null` as source-language evidence.

## Architecture direction

The frontier follows three complementary ideas:

1. **Scope-graph style semantic relations** — resolution is expressed as facts/candidates and selected through relational witnesses rather than imperative dispatch.
2. **Declarative match/rewrite** — resolver selection is represented by relation catalogs and folds, separating semantic rule selection from host execution.
3. **Recursive/fixed-point closure** — sequence traversal and constraint propagation continue through the existing relation kernel rather than host loops.

## Changes

- `SemanticTypeResolver.resolve` no longer uses a host `for` + `if` handler scan; it selects the first supporting handler with `relationFirst` and `relationOptionFold`.
- `SemanticTypeResolver.resolveField` no longer uses host `if`; verified/rejected selection is a relation gate.
- `primitiveHandlers.ts` replaces strict host equality and logical OR with `relationEqual` / `relationAny`.
- `compoundHandlers.ts` replaces host `if`, strict equality, `filter`, `map`, and nested ternaries with relation predicates, `relationSelect`, `relationProject`, `relationResolve`, and a role catalog.
- `constraintStep.ts` replaces the remaining host `||` change predicate with `relationAny`.
- Scanner/lexer parser adapters, syntax-error relation core, ternary binders, generic solver frontier, and scanner resolvers remain covered by the same AST-based audit.

## Null policy

The audit reports `NullKeyword` separately. These occurrences are tagged PHP/source-semantic evidence (for example PHP null literals), not host absence/control sentinels. They are therefore not counted as host-control leaks.

## Verification

`node scripts/audit-phase553-relational-resolver-frontier.cjs`

Result:

- scanned files: **404**
- host leaks: **0**
- leaking files: **[]**
- transpile diagnostics: **0**
- closed surface: **true**
- model/source null evidence: **6 occurrences across 5 files**

The full repository is not claimed to be globally zero-leak; this phase closes the named scanner/lexer/parser-adapter/syntax-error/ternary/generic-solver/resolver frontier.
