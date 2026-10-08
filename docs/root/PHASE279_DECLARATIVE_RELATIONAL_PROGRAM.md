# Phase 279 — Declarative Relational Semantic Program

RouteSync's canonical semantic behavior is now represented as a first-class relational program.

## Boundary

Concrete PHP syntax remains confined to parser/syntax-evidence layers. The canonical semantic program contains only typed relations, schemas, constraints, and rewrites.

## Program

```text
semantic relations
      ↓
relation schemas
      ↓
Horn-style / pattern rewrites
      ↓
constraint calculus
      ↓
fixed-point relation solver
      ↓
rewrite saturation
      ↓
proof-carrying closure
```

The canonical program is validated before execution for unknown relations, arity mismatches, unbound output variables, and unsafe negation.

## Semantic control policy

The canonical ontology does not contain source-construct semantic objects. In particular, source constructs are not represented as `choice`, `repetition`, `branch`, `decision`, or `loop` semantic facts.

A source construct can contribute evidence such as:

```text
condition(scope, predicate)
candidate(scope, outcome)
requires(outcome, predicate)
depends(body, scope)
```

and closure derives consequences such as:

```text
permits(scope, outcome)
precedes(a, b)
reaches(a, b)
recurs(x, x)
converges(x, x, x)
```

The distinction is intentional: syntax supplies evidence; the relational program supplies semantic consequences.
