# Phase 289 — Relational Semantic Boundary

RouteSync's semantic authority is now audited as a boundary, not merely as a naming convention.

## Authority

```text
source AST
  -> syntax/evidence boundary
  -> neutral evidence
  -> typed semantic relations
  -> SemanticRelationProgram
       schemas
       constraints
       rewrites
  -> relation solver
  -> fixed-point closure
  -> rewrite normalization
  -> proof-carrying artifact
  -> target lowering
```

Concrete PHP statement spellings are permitted only in the explicit syntax/evidence boundary. They are not permitted in canonical semantic production modules.

The canonical semantic surface also rejects the historical control ontology (`SemanticChoice`, `SemanticRepetition`, `controlRelations`, `semanticControl`, `semanticRuleEngine`, and `statementKnowledge`).

## Why the solver may still contain imperative implementation mechanics

The requirement is semantic, not a prohibition on implementation syntax inside a generic execution engine. A relation solver must have an execution mechanism for indexing, worklists, matching, stratification, and fixed-point iteration. Those mechanisms do not give `if`, `for`, `while`, or `switch` a semantic meaning.

This follows the architecture seen in declarative systems such as Soufflé, Ascent, and egglog: the semantic program is expressed as relations/rules, while an engine executes the fixed point. egglog additionally unifies Datalog and equality saturation, including incremental execution and lattice reasoning. The engine implementation itself is not the semantic ontology.

## Research direction

Phase 289 treats the following as architectural reference points:

- egglog: Datalog + equality saturation + incremental/lattice reasoning.
- Soufflé: typed relations, recursive rules, fixed-point evaluation, provenance.
- Ascent: relation fixed points with lattice-valued facts.
- Eqlog: Datalog/equality/congruence-oriented reasoning.
- Differential Dataflow: incremental maintenance of derived relations.

RouteSync adopts the *separation of semantic specification from execution substrate*, while retaining its own typed relation vocabulary and proof-carrying closure.
