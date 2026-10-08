# Phase 266 — Relational Semantic Calculus

RouteSync semantic authority is now explicitly above source-language control constructs.

## Authority

1. Parser / Tree-sitter: evidence extraction only.
2. Semantic relations: facts about entities, values, dependencies, requirements, reachability, convergence, recurrence and effects.
3. Constraint calculus: declarative predicates over relation bindings.
4. Relation solver: fixed-point derivation.
5. Rewrite engine: relation-level representation normalization.
6. Target IR: selected representation after semantic closure.

## Forbidden semantic authority

`if`, `for`, `while`, `switch`, `foreach`, `choice`, `repetition`, `decision`, and `recurrence` are not inputs to the canonical solver/rewrite API.

They may exist only in source evidence or compatibility projections.

## External design references

- K: rewrite-based executable semantics and configuration/rule separation.
- SeaHorn: constrained Horn clauses, invariant inference, SMT-based checking.
- cvc5: satisfiability/model finding over combinations of theories.
- MLIR: declarative rewrite rules separated from rewrite execution.
- e-graphs: equality saturation / representation search.

## Design consequence

The semantic question is not "which statement construct is this?". It is:

> Which relations hold, which constraints follow, and which equivalent representation satisfies the target legality/cost constraints?
