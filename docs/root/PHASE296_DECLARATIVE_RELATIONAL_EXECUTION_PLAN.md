# Phase 296 — Declarative Relational Execution Plan

The semantic rule program is compiled into an explicit relational execution plan before closure evaluation.

Plan vocabulary:

- scan
- join
- anti-join
- emit

The plan is derived from typed relation schemas and declarative rewrite rules. It contains no PHP syntax/control vocabulary and no host collection combinator vocabulary.

The solver consumes the compiled plan ordering while retaining the original rule objects for exact pattern matching and provenance. This creates an explicit boundary:

```text
Typed Relations
  -> Declarative Program
  -> Execution Plan
  -> Indexed Relation Store
  -> Delta / Fixed Point
  -> Rewrite Closure + Provenance
```

The canonical semantic production surface is audited for:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`.

All eight are absent from canonical semantic production files. Syntax/evidence infrastructure and tests remain outside this execution-authority audit.
