# Phase 272 — Construct-Free Control Projection

The PHP syntax adapter no longer constructs `SemanticChoice` or
`SemanticRepetition` for `if`, `while`, `foreach`, `for`, or `switch`.

Those syntax forms remain parser evidence, but their semantic projection is now
neutral relational evidence:

- predicates project to `condition` / `requires`;
- candidate/body participation projects to `candidate`;
- ordinary dependencies project to `depends`;
- mutual dependency is closed to `reaches(x,x)` and then `recurs(x,x)`;
- switch/match cases are represented by candidate and predicate relations;
- no `control`, `choice`, `repetition`, `branch`, `decision`, or loop relation is
  produced by the adapter.

The syntax dispatcher can still inspect `if_statement`, `while_statement`, etc.
because a parser adapter necessarily has to recognize source evidence. The
important invariant is that those names never cross the evidence boundary into
the semantic ontology.

## Architecture

```text
PHP syntax
  -> evidence producer
  -> typed data-flow relations
  -> canonical relation projection
  -> constraint calculus
  -> relational fixed point
  -> rewrite/saturation
  -> proof-carrying semantic closure
  -> target lowering
```

`semanticControl*` remains only as compatibility infrastructure for historical
artifacts/tests. It is no longer called by the PHP semantic producer for these
constructs.
