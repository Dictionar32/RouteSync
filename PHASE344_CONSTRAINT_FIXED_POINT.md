# Phase 344 — Constraint Fixed-Point Authority

The semantic authority boundary now exposes constraint solving as a relation program.

`ConstraintProgram` contains seed facts and declarative rewrite rules. `solveConstraintProgram`
delegates closure to the canonical semantic relation solver, which performs indexed matching,
stratification and fixed-point saturation.

`SyntaxClosureFact` provides the same model for parser evidence: evidence becomes facts, rules
derive candidates/requirements/exclusions/diagnostics, and closure produces the semantic witness set.

The important invariant is architectural: semantic meaning is represented by relation facts and
rewrite rules; host control flow is an implementation detail of the relation engine, not the
semantic specification.
