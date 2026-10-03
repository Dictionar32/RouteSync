# RouteSync Phase 392 — Scanner/Resolver Relation Authority

## Scope

Phase 392 continues Phase 391 with a narrower semantic objective: remove a concrete resolver sentinel from scanner authority and make the resolver's absence/presence an explicit relation witness.

### Implemented

`packages/core/src/compiler/scanner/subscanners/queryEvidenceProducer.ts`

- `modelFromReceiver` now returns `RelationOption<ModelName>`.
- Recursive receiver resolution propagates `some/none` witnesses rather than `undefined`.
- Query and nested-query projections consume the result with `relationOptionFold`.
- The model-resolution decision is therefore represented as a relation result before canonical query AST projection.

The change is mirrored into the archive's synchronized `RouteSync/` representation.

## Architecture direction

```text
syntax evidence
  -> typed scanner facts
  -> candidate relations
  -> requirements / exclusions / dependencies
  -> fixed-point closure
  -> rewrite / equality saturation
  -> canonical projection
```

The important distinction is semantic authority: replacing `if` with a ternary or `for` with recursion is not sufficient. A decision must become a candidate/constraint relation consumed by the solver.

## Research basis

MLIR PDLL separates pattern matching from rewriting and represents patterns declaratively; DRR similarly expresses source patterns, result patterns, and constraints as data rather than hand-written dispatch. MLIR's generic rewrite driver repeatedly applies patterns until a fixed point or configured limit. See the official MLIR documentation.

JastAdd documents circular attributes as declarative fixed-point computations, with convergence obtained from finite-height lattices and monotone equations.

Souffle/Datalog provides the complementary relation/rule model: facts and rules define intensional relations, and bottom-up evaluation reaches a least fixed point. Semi-naive evaluation further makes recursive closure incremental.

Egg/egg illustrates the rewrite side: equality saturation keeps equivalent alternatives in an e-graph and saturates until no new equalities are added, after which extraction chooses a canonical representative.

## Audit

Regex lexical audit over production scanner TypeScript files in this extracted workspace:

- 492 scanner TS files examined.
- 3,695 forbidden-pattern occurrences remain.
- `queryEvidenceProducer.ts`: 777 occurrences after the targeted migration.
- `astClassifierEvidence.ts`: 329 occurrences.
- The audit is lexical, not a proof that every occurrence is semantic authority. Tests and source-language token names can contribute hits.

The result is intentionally not described as scanner-wide eradication. The next frontier remains the high-density scanner/resolver families, especially query evidence, AST classification, controller canonicalization, migration/resource resolvers, and request/service canonicalization.
