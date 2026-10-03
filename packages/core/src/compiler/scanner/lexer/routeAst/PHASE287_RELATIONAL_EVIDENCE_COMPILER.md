# Phase 287 — Relational Evidence Compiler

The canonical semantic boundary now consumes a relation-native evidence compiler.

```text
syntax frontend
  -> neutral evidence
  -> typed semantic facts/data-flow
  -> relation-native evidence compiler
  -> declarative semantic relation program
  -> constraint/rewrite solver
  -> fixed-point closure
  -> proof-carrying semantic artifact
```

The semantic adapter no longer owns the canonical relation projection. It only
collects typed evidence. `semanticEvidenceRelationCompiler.ts` is the single
projection authority and contains no source-language statement vocabulary.

Concrete source grammar remains isolated to syntax infrastructure. It is not a
semantic ontology and is never consumed by the relation solver or rewrite engine.

The relation program remains the declarative authority: schemas, constraints,
and rewrites are data consumed by generic execution machinery.
