# Phase 301 — Typed Syntax Relation IR + Declarative Error Core

## Architectural change

Phase 301 moves the syntax boundary from executable pattern helpers to a typed
syntax relation program.

```text
Concrete syntax evidence
        |
        v
Typed SyntaxRelationProgram
        |
        +--> token relations
        +--> sequence relations
        +--> repetition relations
        +--> termination relations
        +--> delimited relations
        |
        v
Relational execution substrate
        |
        +--> syntax facts
        +--> presence
        +--> diagnostics
        |
        v
Semantic typed relations
        |
        v
constraints -> rewrites -> closure
```

## New authority

`syntaxRelationProgram.ts` is the syntax execution IR. `syntaxGrammar.ts` now
compiles patterns into that IR instead of owning recursive parser dispatch.

`syntaxErrorRelationCore.ts` expresses syntax failures as typed relations and
uses the existing semantic relation solver to derive diagnostic facts.

## Error relations

The initial error vocabulary is:

- `expected(position, value)`
- `observed(position, value)`
- `located(position, span)`
- `severity(position, level)`
- `diagnostic(position, code, expected, observed)`
- `blocks(code, span)`

Rules derive diagnostics from facts. Error accumulation therefore becomes a
relation closure rather than an imperative error branch.

## Ternary semantics

PHP ternary, short ternary, null-coalesce, and match constructs remain syntax
evidence only. Their semantic projection uses neutral relations such as
`condition`, `candidate`, `requires`, `excludes`, and `permits`; no canonical
semantic choice/repetition ontology is introduced.

The TypeScript implementation still contains ordinary conditional expressions
in older semantic production files. These are implementation syntax and are
separate from PHP ternary semantic representation. Phase 301 does not claim
that every TypeScript `?:` has been removed.

## Boundary result

AST audit over the semantic production surface reports zero occurrences of:

- `if`
- `for`
- `while`
- `switch`
- `.map()`
- `.filter()`
- `.reduce()`
- `.flatMap()`

The broader `routeAst` surface still contains collection calls in older
route declaration/syntax model infrastructure; those remain a separate
migration target and are not represented as semantic authority.

## Research basis

The design is informed by several declarative language systems beyond the
previous RouteSync research set:

- Statix: typed terms, constraints, user-defined constraint rules, and a
  language-independent constraint solver.
- SDF3/Spoofax: declarative syntax definitions and separation between syntax
  specification and language-independent implementation.
- Rascal: first-class typed relations as sets of uniformly typed tuples.
- Silver: attribute-grammar equations and declarative semantic attributes.

These systems reinforce the separation between language description and the
execution mechanism rather than adding another syntax-specific dispatcher.
