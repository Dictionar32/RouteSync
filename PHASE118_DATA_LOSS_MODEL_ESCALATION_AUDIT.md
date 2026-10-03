# Phase 118 — Data-Loss / Model Escalation Audit

## Scope

Audit continued from Phase 117 across `packages/core/src/compiler/scanner/lexer/routeAst`.

Targets:

- `??`, `||` fallback paths, ternary expressions, `if`, `switch`, `while`
- positional indexing and arithmetic (`[0]`, `[1]`, `i + 1`, `i + 2`, `i + 123`)
- `.at()`, `indexOf`, `findIndex`, negative `slice`
- syntax navigation ownership
- semantic knowledge encoded as parser control flow
- silent data loss in route/group/resource facts

## Material finding

A real data-loss path was found in group constraint extraction.

Previous behavior represented group constraints as only:

- `where`
- a single `value`

and the group constraint policy discarded `whereIn` and the other typed constraint helpers.

Laravel documents that nested route groups merge `where` conditions with their parent group. The syntax model therefore now preserves the complete constraint fact (`method`, `parameter`, `value`, `values`) instead of reducing it to a `where`-only representation.

## Implementation

### Constraint model

`RouteGroupConstraintFact` is now a first-class syntax fact:

- `method`
- `parameter`
- `value`
- `values`

All Laravel route constraint methods are represented by the declarative strategy catalog. No constraint method is silently discarded.

### Target model

Route target AST construction was raised into `routeSyntaxModel` through `routeTargetAst`, removing target-kind ternary knowledge from the parser.

### Traversal model

`statementContinuationCursor` was added to `TokenCursor` so statement continuation remains a named syntax-navigation relation instead of parser-owned `end.atEnd ? end : end.advance()` arithmetic/control flow.

### Resource middleware

Resource middleware AST construction remains catalog-driven and no longer uses ternary semantic builders.

## Static audit

- `??` outside navigation primitives: **0**
- numeric `[0]` / `[1]` outside navigation primitives: **0**
- `.at(0/-1)` outside navigation primitives: **0**
- `indexOf` / `findIndex`: **0**
- negative `slice`: **0**
- `i + 1`, `i + 2`, `i + 123` outside navigation primitives: **0**
- `routeSyntaxModel` `if`: **0**
- `routeSyntaxModel` `switch`: **0**
- `routeSyntaxModel` `while`: **0**
- `routeSyntaxModel` conditional-expression ternary: **0**
- `routeResourceDeclarationAst` conditional-expression ternary: **0**
- TypeScript transpile of all `routeAst` files: **PASS**

Remaining `if`/`while` constructs are confined to generic token traversal, delimiter balancing, parser execution guards, or regex binding extraction. Positional arithmetic remains confined to `TokenCursor` and delimiter navigation.

## Architectural basis

Tree-sitter explicitly supports named fields so syntax consumers can address children by semantic names instead of ordered positions, and its navigation API separates named-node traversal from anonymous token details.

Laravel 13 documents route groups as mergeable attribute scopes, including merged middleware and `where` conditions, and resource middleware as action-scoped configuration. The RouteSync model follows the same separation: syntax facts are represented upstream and traversal is delegated to navigation primitives.

## Validation limitation

Repository-wide `tsc --noEmit` / test execution is not claimed as a pass because the current environment lacks several repository dependency/type-definition packages. Validation here uses TypeScript transpilation plus targeted static AST/source audits.
