# Phase 334 — Relational lexical witness boundary

Phase 334 moves the lexical semantic adapter from sentinel lookup to explicit relation witnesses.

## Changes

- `syntaxValue.ts` now exposes token facts and vocabulary lookups as `RelationOption` witnesses.
- Catalog lookup is relational rather than map-result inspection.
- Lexical fact construction is a relation over typed vocabulary catalogs.
- `routeDeclarationParserHelpers.ts` now exposes route-method/path/token values as relation witnesses.
- `TokenCursor.findWitness` provides a semantic witness boundary without changing the legacy cursor continuation contract yet.

## Semantic boundary

```text
raw token / cursor evidence
        -> lexical vocabulary relation
        -> RelationOption witness
        -> syntax fact relation
        -> candidate / requirement relations
        -> solver closure
        -> rewrite / lowering
```

The remaining legacy cursor accessors are deliberately isolated for the next migration. They still serve parser continuation mechanics; converting them blindly would alter traversal semantics.

## Research basis

The architecture follows the same separation demonstrated by declarative rewrite systems and relational engines: MLIR PDLL/DRR separates matching constraints from rewrites; Soufflé treats relations and Horn rules as the semantic program; egglog combines Datalog with equality saturation; Statix models name resolution as scope-graph constraints; JastAdd uses circular attributes with finite-height lattices and monotone equations for fixed-point evaluation.
