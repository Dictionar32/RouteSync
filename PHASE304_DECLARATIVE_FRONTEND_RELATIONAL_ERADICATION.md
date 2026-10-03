# Phase 304 — Declarative Frontend Relational Eradication

## Objective

Raise the declarative semantic boundary beyond the Phase 303 CHR-style
constraint engine into the remaining production parser/adapter and relational
runtime surface.

The rule is now structural rather than lexical:

```text
source syntax
    -> syntax evidence relations
    -> typed relation program
    -> constraint store
    -> declarative matching
    -> CHR propagation / simplification / simpagation
    -> rewrite
    -> fixed point / closure
    -> proof-carrying semantic artifact
```

The canonical production surface does not encode source semantics through:

- `if`
- `for`
- `while`
- `switch`
- `map`
- `filter`
- `reduce`
- `flatMap`
- JavaScript/TypeScript conditional expressions (`?:`)

This does **not** mean PHP source syntax disappears. PHP `if`, `for`, `while`,
`switch`, ternary, and collection methods remain concrete syntax evidence. The
prohibition applies to their use as implementation-level semantic dispatch or
traversal mechanisms in the canonical production surface.

## Architectural change

### 1. Parser dispatch becomes relation-table dispatch

`grammarCatamorphism`, `calleeCatamorphism`, and `offsetCatamorphism` no longer
use `switch`. Their constructor selection is represented as immutable dispatch
relations keyed by grammar kind.

### 2. PHP boundary adapter becomes relation-driven

`boundaryAdapter.ts` no longer uses imperative branch chains or host collection
`.map()`. Argument, statement, array-key, operator, cast, class-reference and
member-reference interpretation are table-driven and use the shared relation
projection primitives.

### 3. Generic relational solver becomes construct-free

The semantic relation solver, rewrite engine, typed relation carrier,
constraint-handling engine and relational collections use relation recursion and
`booleanCase` as the execution primitive. Conditional expressions were removed
from the canonical implementation surface rather than being treated as an
acceptable exception.

### 4. Parser utility/algebra layer is raised too

The source-location boundary, expression parse error boundary, member algebra
and field algebra were migrated to relation projection and data-driven case
selection.

### 5. Audit boundary is structural

The Phase 304 audit uses the TypeScript AST rather than grep. It rejects:

- `IfStatement`
- `ForStatement`
- `ForInStatement`
- `ForOfStatement`
- `WhileStatement`
- `DoStatement`
- `SwitchStatement`
- `ConditionalExpression`
- calls to `.map()`, `.filter()`, `.reduce()`, `.flatMap()`

The audit excludes historical phase files and test files because those are
verification artifacts, not compiler semantic authority.

## Research synthesis

The architecture is not a direct clone of one existing system. It combines the
useful abstractions found across several families:

- **Soufflé / Datalog** — relations, Horn rules, typed predicates and fixed-point
  evaluation provide the relational knowledge substrate.
- **egglog / e-graphs** — equality saturation plus Datalog demonstrates that
  relational facts and rewrite saturation can share one execution model.
- **CHR** — propagation, simplification and simpagation provide explicit
  constraint-store rewrite modes.
- **Statix** — static semantics can be specified as typed terms and constraints
  solved by a dedicated solver rather than handwritten AST dispatch.
- **SDF3/Spoofax** — syntax is a declarative specification whose implementation
  artifacts are derived separately.
- **Rascal** — typed relations and algebraic data types provide a natural model
  for language facts and structured semantic values.
- **MLIR PDL/PDLL** — matching and rewrite intent can itself be represented by a
  declarative pattern IR.
- **K Framework** — executable semantics can be expressed as configuration and
  rewrite rules rather than embedding semantics in host-language statement
  dispatch.
- **Rosette** — solver-aided constraints can be treated as first-class logical
  obligations and queried by a generic solver interface.
- **WebAssembly validation** — validation can be specified declaratively as
  constraints over instruction sequences, with an implementation derived from
  the specification.
- **CompCert** — formal semantic relations and refinement are the right long-term
  verification target when compiler transformations must preserve meaning.
- **CiaoPP** — abstract interpretation and assertions show how semantic facts
  can be inferred and checked as properties instead of hard-coded control paths.

Systems such as CodeQL, Differential Dataflow, Datafrog, DDlog, Ascent, Flix,
Nemo, Cranelift, Graal, and the other surveyed systems are useful reference
points for individual mechanisms, but RouteSync's authority boundary remains
its own typed semantic relation model.

## Important distinction

`booleanCase` is not a new semantic node for PHP conditionals. It is a small
engine primitive that selects between already-computed execution continuations.
The semantic ontology remains relation-only: source conditions become facts,
constraints and rule premises; they are not promoted to a host-language branch
node.

## Verification

Phase 304 static structural audit:

```text
PHASE304-PRODUCTION-AST-CLEAN
```

The audit covers the production files below:

- `packages/core/src/compiler/scanner/lexer/routeAst/**`
- `packages/cli/src/parsers/php/**`

with historical phase files and test files excluded.

TypeScript source parsing of the audited production surface also passes without
syntax diagnostics.
