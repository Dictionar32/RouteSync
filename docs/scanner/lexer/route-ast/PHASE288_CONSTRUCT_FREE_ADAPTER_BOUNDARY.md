# Phase 288 — Construct-Free Semantic Adapter Boundary

## Goal

Make the PHP semantic adapter a consumer of syntax evidence rather than a
source-construct dispatcher. The canonical semantic layer must not encode
`if`, `for`, `while`, or `switch` as semantic concepts, and the adapter itself
must not contain those control-dispatch keywords.

## Boundary

```text
PHP AST
  |
  v
syntax/evidence registries
  |  concrete PHP expression/statement spellings allowed here
  v
neutral Knowledge/Data-Flow evidence
  |
  v
semanticEvidenceRelationCompiler
  |
  v
SemanticRelationProgram
  |-- schemas
  |-- constraints
  `-- rewrites
  |
  v
generic relation/constraint solver
  |
  v
proof-carrying semantic closure
```

`phpAstSemanticKnowledgeDataFlowAdapter.ts` now performs orchestration and
semantic evidence construction only. Its source contains no lexical
`if`, `for`, `while`, or `switch` token. Expression-kind dispatch was moved to
`phpAstExpressionSyntaxEvidenceRegistry.ts`, which is explicitly a syntax /
evidence boundary.

The statement counterpart remains
`phpAstStatementSyntaxEvidenceRegistry.ts` for the same reason.

## Higher-level model

A source control construct is not transformed into a semantic control node.
Instead the evidence compiler exposes relations such as:

- `condition(scope, predicate)`
- `candidate(scope, candidate)`
- `requires(candidate, predicate)`
- `excludes(candidate, predicate)`
- `depends(consumer, producer)`
- `produces(producer, value)`
- `consumes(consumer, value)`
- `precedes(producer, consumer)`
- `reaches(source, target)`
- `recurs(source, target)`

The declarative program derives higher-order relations by fixed-point closure.

## Research alignment

This phase adopts the useful separation demonstrated by relational systems:

- Soufflé treats relations and Horn rules as the semantic specification and
  synthesizes an execution strategy; its provenance machinery also records
  which rule produced a tuple. citeturn1search4turn1search1
- Ascent supports relation fixed points and lattice-valued facts, showing that
  a relation engine can represent monotone semantic state without introducing
  syntax-shaped control nodes. citeturn1search3turn1search7
- egglog combines Datalog, incremental execution, equality saturation,
  congruence closure, lattice reasoning, and extraction. RouteSync uses the
  relational/rewrite separation but keeps its canonical ontology domain
  specific and construct-free. citeturn0search10turn0search1
- Differential Dataflow demonstrates incremental maintenance of relational
  computations as inputs change; this motivates future incremental closure,
  without making runtime dataflow the semantic ontology. citeturn1search2
- Eqlog combines Datalog with equality/congruence closure and semi-naive
  fixed-point evaluation, another useful direction for future identity
  reasoning. citeturn1search5

## Validation

Targeted TypeScript validation covers:

- semantic PHP adapter
- expression syntax/evidence registry
- relation evidence compiler
- semantic relation program
- behavior catalog/kernel
- relation solver
- constraint calculus
- closure/lowering artifacts
- Phase 286 and Phase 287 tests

A repository-wide TypeScript build is intentionally not claimed here because
this checkpoint retains unrelated pre-existing workspace type/dependency
failures outside this change.
