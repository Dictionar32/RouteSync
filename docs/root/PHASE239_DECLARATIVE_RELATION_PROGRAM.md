# Phase 239 — Declarative Relation Program Validation

The control semantic layer now treats relation schemas + rewrite rules as a first-class declarative program.

## Goal

Prevent semantic meaning from leaking back into procedural `if`/`switch` dispatch. The generic solver consumes a validated relation program; domain semantics are declared in schemas and rewrites.

## Added

- `semanticRelationProgram.ts`
  - relation schemas with arity
  - rule validation
  - unknown-relation diagnostics
  - arity diagnostics
  - unbound rewrite-variable diagnostics
  - assertion before solver execution
- Control relation schemas are declared explicitly and the Phase 234 control rewrite catalog is validated before use.
- Phase 239 regression test validates both accepted and rejected declarative programs.

## Architecture

```text
syntax evidence
    -> typed semantic facts
    -> relation program (schemas + rewrites)
    -> generic relation solver
    -> fixed point
    -> semantic data-flow
```

`if`, `switch`, `while`, and `for` remain source/evidence forms at the language boundary. Their semantic meaning is represented by `choice`, `predicate`, `alternative`, `iteration`, `successor`, `guard`, `merge`, `fixed_point`, and `backedge` relations.

Solver loops remain mechanics of fixed-point evaluation, not semantic ontology.
