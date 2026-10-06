# Phase 978 — Upstream Schema Authority and Relation Provenance

Phase 978 closes two semantic bypasses found after Phase 977.

## Changes

- `ModelSemanticDefinition` now owns the canonical `ModelSchema` projection for its resolved table.
- `buildModelSemanticDefinition()` derives that schema projection from the cumulative `SchemaInterface` once.
- `modelAstFromSemantic()` no longer accepts a second resolved schema argument; it consumes `model.schema`.
- `modelProducer` no longer calls `resolveModelSchema()` after semantic construction.
- structural `model_relation` relations now carry the canonical `ModelSemanticRelation` identity.
- `sourceModelReferenceIndexFromCatalog()` consumes `model.definition.relation.semantic` rather than rebuilding relations from `ModelDefinition.relations`.
- `GraphEdgeRelation` carries optional model-relation provenance through the existing graph-edge projection boundary.

## Authority invariant

```text
MigrationAst
  -> SchemaInterface
  -> ModelSemanticDefinition.schema
  -> ModelAst projection

EloquentRelationAst + SchemaRelationIndexInterface
  -> ModelRelationInterface
  -> ModelSemanticRelation
  -> StructuralSemanticRelation
  -> GraphEdgeRelation
  -> GraphEdgeRelationSink
```

No second schema resolver is introduced and no second graph/dataflow solver is introduced.

## Validation

The Phase 978 static audit passes. Phase 858 graph-edge closure and Phase 970 manifest/dataflow closure audits remain passing. A full TypeScript build was not claimed because this checkpoint has no local `node_modules/.bin/tsc`.
