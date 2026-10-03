# Phase 298 — Typed Relational Syntax Boundary

RouteSync now treats the syntax/evidence boundary as a relation-producing boundary rather than a semantic execution layer.

## Authority

```text
PHP syntax
  -> syntax/evidence registry
  -> neutral evidence relations
  -> typed semantic relations
  -> executable relational IR
  -> indexed solver / rewrite engine
```

`phpAstSyntaxEvidenceRelationProgram.ts` records the neutral relation contract. Concrete PHP grammar remains confined to the parser/evidence boundary; it is not part of the canonical semantic ontology.

The executable relational plan now carries relation schema metadata, arity, inferred slot sorts, indexes, and join keys. This makes the execution plan a typed relational IR rather than an interpreted rule list.

## Forbidden canonical execution vocabulary

The canonical semantic authority is audited for:

- if
- for
- while
- switch
- map
- filter
- reduce
- flatMap

and for the retired semantic ontology:

- SemanticChoice
- SemanticRepetition
- controlRelations
- semanticControl
- semanticRuleEngine
- statementKnowledge

Raw token navigation and concrete parser mechanics remain a syntax implementation concern. They are not imported by the semantic solver or relational execution plan.
