# Phase 548 — Scanner/Lexer/Resolver Relational Frontier

## Direction

The scanner/lexer/resolver boundary is pushed toward the same semantic architecture used by declarative syntax and rewrite systems: source characters and tokens remain evidence; dispatch, validation, candidate selection, and state transitions are represented through relations and relation gates.

External research confirms the useful split:

- MLIR PDL/PDLL represents matching and rewriting declaratively and makes patterns transformable/optimizable as IR.
- MLIR's declarative rewrite infrastructure separates pattern definition from pattern application and reaches fixed points through rewrite drivers.
- K uses configuration + rewrite rules as an executable semantic specification.
- equality saturation provides a rewrite-space model rather than imperative decision sequencing.

## Changes

- Added `relationAt` to the compiler relational sequence and removed direct `slice()`-based element selection from the typed semantic relation algebra.
- Removed executable `if`/conditional construction from scanner AST constructors and HTTP-status validation; these now use relation gates.
- Removed the delimiter navigation `slice()` escape; stack truncation is expressed by the relational sequence primitive.
- Replaced strict host equality/inequality and logical `&&`/`||` decisions in the scanner classification/data-flow frontier with relation predicates.
- Converted route source-context selection to relation candidates/presence rather than host `undefined` fallback semantics.
- Removed host `undefined` from semantic expression-evidence callbacks by returning relation/semantic witnesses.
- Converted semantic state merge selector absence to explicit `Presence<KnowledgeId>`.
- Removed the remaining resolver strict inequality from `RouteSecurityResolver`.
- Extended Phase 548 audit to structurally inspect production scanner/lexer/resolver TypeScript AST, rather than relying on lexical grep that confuses language operator strings with host control flow.

## Audit

`audit:scanner-lexer:phase547`: `ok=true`

`audit:scanner-lexer:phase548`: `ok=true`

Phase 548 audit scope:

- production `scanner/lexer`
- production `scanner/resolvers`
- excludes tests/spec fixtures
- detects executable `if`, loops, `switch`, conditional expressions, host collection combinators, `trim`, `slice`, strict equality, logical operators, and `undefined` identifiers

Result:

- executable surface clean: `true`
- undefined identifier leaks: `[]`
- TypeScript transpile diagnostics for modified frontier files: clean

## Architectural frontier

The remaining operator spellings such as PHP `===`, `!==`, `&&`, and `||` inside token/operator catalogs are language evidence, not host-language semantic branching. They must remain because erasing those strings would destroy lexical information. The architectural rule is therefore: **operator spelling may exist as evidence; executable semantic selection must be relation-driven.**

Next frontier: scanner cursor/state evidence and resolver candidate closure should converge on a common relation catalog so lexical state, candidate ranking, scope/name resolution, and semantic rewrites share one proof-carrying relation substrate.
