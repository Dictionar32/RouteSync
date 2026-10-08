# Phase 293 — Relational Execution Eradication

Phase 293 tightens the semantic authority boundary beyond Phase 292.

## Forbidden semantic execution constructs

The canonical semantic execution surface must not use these host-language collection/control constructs:

- `if`
- `for`
- `while`
- `switch`
- `.map(...)`
- `.filter(...)`
- `.reduce(...)`
- `.flatMap(...)`

The audited authority surface is:

- `phpAstSemanticKnowledgeDataFlowAdapter.ts`
- `semanticRelationSolver.ts`
- `semanticConstraintCalculus.ts`
- `semanticRewriteEngine.ts`
- `semanticRelationalCollections.ts`
- `semanticEvidenceRelationCompiler.ts`
- `semanticClosureEngine.ts`
- `semanticRelationProgram.ts`
- `semanticRelationTheory.ts`

## Higher-level execution model

```text
syntax evidence
    -> typed evidence
    -> relational projection
    -> schemas / constraints / rewrites
    -> recursive relation algebra
    -> indexed delta evaluation
    -> fixed point
    -> rewrite closure
    -> provenance-carrying semantic artifact
```

The recursive collection algebra (`project`, `retain`, `expand`, `accumulate`, `visit`) is execution machinery only. Semantic meaning remains in relations, constraints, and rewrite rules.

Concrete PHP statement names remain confined to syntax/evidence infrastructure; they are not semantic relations or solver nodes.
