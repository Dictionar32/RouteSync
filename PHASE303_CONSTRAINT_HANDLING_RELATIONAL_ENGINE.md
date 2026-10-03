# Phase 303 — Constraint Handling Relational Engine

Phase 303 extends the typed relation substrate with CHR-style declarative constraint handling.

## Research basis

The design was cross-checked against Constraint Handling Rules (CHR), Statix, SDF3 and Rascal:

- CHR distinguishes propagation, simplification and simpagation over a constraint store and reaches solutions through repeated rewriting.
- Statix treats static semantics as typed terms plus constraints and rules solved by a constraint solver.
- SDF3 keeps syntax specification declarative and separates syntax definition from implementation details.
- Rascal treats relations as typed sets of tuples and supports algebraic data types for structured language representations.

## RouteSync model

```text
syntax evidence
      |
      v
typed syntax relations
      |
      +---- syntax/error constraints
      |
      +---- semantic relations
      |
      v
constraint handling rules
      |
      +---- propagation
      +---- simplification
      +---- simpagation
      |
      v
rewrite / fixed point
      |
      v
proof-carrying semantic closure
```

## Rule forms

### Propagation

Keep matched constraints and derive additional relations.

```text
H  ==>  B
```

### Simplification

Remove matched constraints and replace them with normalized relations.

```text
H  <=>  B
```

### Simpagation

Retain a selected part of the matched head while replacing another part.

```text
H_keep \\ H_remove  <=>  B
```

These are represented as typed relation patterns rather than source-language control nodes.

## New API

`semanticConstraintHandlingRules.ts` exposes:

- `ConstraintHandlingRule`
- `ConstraintHandlingMode`
- `ConstraintHandlingResult`
- `solveConstraintHandlingRules`

The executor uses the existing relation algebra and fixed-point substrate. It does not dispatch on PHP statements or encode `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, or `flatMap` as semantic operations.

## Ternary policy

PHP ternary/short-ternary/null-coalesce/match remain syntax evidence. Their semantic projection is relational (`condition`, `candidate`, `requires`, `excludes`, `permits`) and does not create semantic choice/repetition nodes.

The remaining TypeScript conditional expressions in older implementation code are implementation syntax, not PHP semantic ontology. They are therefore not counted as PHP ternary semantics in this phase.

## Validation

- targeted strict TypeScript compilation: PASS
- Phase 297 execution-plan regression: PASS
- Phase 302 production boundary audit: PASS
- Phase 303 CHR propagation/simplification/simpagation runtime test: PASS
- AST production audit for the Phase 302 routeAst production surface: zero banned execution constructs

Full repository compilation is intentionally not claimed by this phase.
