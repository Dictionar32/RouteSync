# Phase 290 — Relational Execution Boundary

RouteSync now treats the semantic boundary as an executable architectural contract.

## Authority

```text
PHP syntax
  -> syntax/evidence boundary
  -> neutral typed evidence
  -> semantic relation compiler
  -> relation program
       schemas
       constraints
       rewrites
  -> generic execution substrate
       stratification
       delta evaluation
       fixed point
       provenance
  -> semantic closure
  -> target lowering
```

Concrete source control vocabulary is not semantic vocabulary. `if_statement`,
`for_statement`, `while_statement`, `foreach_statement`, and `switch_statement`
are permitted only at the explicit syntax/evidence boundary.

The canonical semantic production surface also rejects the legacy control ontology:
`SemanticChoice`, `SemanticRepetition`, `controlRelations`, `semanticControl`,
`semanticRuleEngine`, and `statementKnowledge`.

## Execution-mechanism distinction

The generic relation solver may use ordinary implementation constructs such as
iteration, branching, indexes, and worklists. Those constructs implement the
solver; they are not facts or semantic nodes. Removing them from the solver by
syntactic substitution would make the architecture less clear rather than more
declarative.

This distinction follows the useful separation seen in Datafrog/DDlog and the
Datalog family: the semantic specification describes relations and rules while
the engine performs incremental/fixed-point evaluation. Datafrog exposes static
relations and monotonically increasing variables; DDlog describes the desired
input/output mapping and synthesizes incremental evaluation. citeturn1search0turn1search9

Egglog provides the strongest reference for the next layer because it unifies
Datalog fixed-point reasoning with equality saturation and rewriting. citeturn0search9turn0search0

Ascent and LADDDER further motivate lattice-aware fixed points and incremental
whole-program analysis. citeturn0search1turn1search12
