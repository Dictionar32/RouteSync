# Phase 421 — Scanner/Lexer + Resolver Relational Authority

## Goal

Continue the migration from host-language control/data-structure authority toward declarative semantic relations, candidate resolution, and relation lookup/fold.

## Research basis

- MLIR PDLL separates declarative matching from rewrite and represents rewrite intent at a higher abstraction level.
- MLIR PDL represents matcher/rewrite structure as IR, making the transformation itself inspectable and optimizable.
- Soufflé models semantic computation as typed relations and rules rather than imperative traversal.
- egglog combines equality saturation with Datalog-style relational reasoning.

These references support the RouteSync direction: scanner/resolver authority should emit and consume semantic relations/catalogs, while host-language branching remains only as an implementation mechanism underneath the semantic boundary.

## Changes

### Lexer authority

`packages/core/src/compiler/scanner/lexer/astClassifierEvidence.ts`

- Replaced the single-token `ReadonlyMap` authority (`has/get`) with an immutable relational tuple catalog.
- Single-token classification now resolves through `relationLookup` + `relationOptionFold`.
- Replaced `findIndex` authority paths with `relationIndexOf`.
- Replaced targeted positional `index + N` access in classifier authority with `relationAdvanceIndex`.
- Repaired the binary-expression positional projection so the right-hand slice uses the resolved relation index.

The PHP token strings `===`, `&&`, `||`, and `??` remain as lexical vocabulary where they describe source-language tokens. They are not treated as host-language semantic control operators by this phase.

### Resolver authority

`packages/core/src/compiler/scanner/upstream/route/routeResourceSemanticResolver.ts`

- Replaced collection `.map/.filter` authority with `relationProject/relationSelect`.
- Replaced knowledge-index `.get`/fallback paths with `relationLookup` + `relationOptionFold`.
- Replaced resolver conditionals and ternary selection with `relationGate`.
- Replaced direct equality predicates with `relationEqual` / `relationAll`.
- Kept the resolver AST-free and fact-oriented.

### Ternary resolver

`packages/core/src/semantic/plugins/expression/ternaryHandler.ts`

- Replaced host negated equality predicates with `relationNotEqual`.
- Ternary branch selection and nullability selection remain candidate/relation driven.

### Syntax error core

`packages/core/src/compiler/scanner/lexer/routeAst/syntaxErrorRelationCore.ts` remains relation-rule based with no forbidden authority constructs detected in the targeted audit.

## Validation

- TypeScript transpilation diagnostics: 0 for all modified production files.
- Targeted forbidden-pattern audit: 0 in `routeResourceSemanticResolver.ts`, `ternaryHandler.ts`, and `syntaxErrorRelationCore.ts`.
- `astClassifierEvidence.ts`: `Map.has/get` and `.findIndex` authority paths are removed; remaining lexical vocabulary and legacy optional-result representation are explicitly outside this phase's catalog cutover.
