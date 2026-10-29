# Phase 278 — Declarative Relational Semantic Program

Phase 278 moves the canonical semantic behavior program out of the execution
kernel and into `semanticRelationalBehaviorCatalog.ts`.

The architecture is now explicitly split into:

```text
syntax evidence
    ↓
typed semantic facts
    ↓
canonical relations
    ↓
semanticRelationalBehaviorCatalog
    ↓
constraint solver + relation fixed point
    ↓
relation rewrite / normalization
    ↓
proof-carrying closure
```

The behavior catalog contains only relation schemas, patterns, constraints and
rewrite rules. It has no parser statement dispatch and no source-construct
ontology.

The syntax boundary remains the only place that recognizes concrete PHP
statement spellings. This is intentional: a parser must recognize syntax, but
semantic truth must not be represented by syntax-shaped concepts.

The canonical semantic audit now rejects both legacy control ontology names and
concrete statement-kind names in the semantic kernel, relation theory, solver,
rewrite engine, closure, compilation artifact and semantic adapter.
