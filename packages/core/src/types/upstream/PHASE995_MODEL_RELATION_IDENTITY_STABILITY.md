# Phase 995 — Canonical model-relation identity after reconciliation

Phase 995 closes an identity bug introduced by the explicit `ModelSemanticRelationIdentity` boundary in Phase 994.

## Finding

The model semantic builder initially created relation identity from the Eloquent relation's raw `RelationKey`. For a convention relation, that key is represented as `convention`. Upstream reconciliation can prove the same relation against exactly one schema foreign key and canonicalize the semantic key to an explicit `(foreign, local)` pair.

If identity were left untouched, the same semantic relation could therefore have two identity keys:

```text
Eloquent convention
  -> foreignKey = convention
  -> identity = convention

Schema reconciliation
  -> foreignKey = explicit:order_id,id
  -> identity = convention   <-- stale
```

This is incorrect because identity must describe the canonical semantic relation, not the pre-reconciliation evidence form.

## Repair

`reconcileSemanticRelation()` now rebuilds `ModelSemanticRelationIdentity` from the canonical `semanticKey` after reconciliation. Provenance remains separate and is never included in identity.

```text
EloquentRelationAst
  -> seed ModelSemanticRelation
  -> schema reconciliation
  -> canonical RelationKey
  -> ModelSemanticRelationIdentity(canonical key)
  -> ModelRelationInterface
  -> graph relation identity/dedup
```

## Laravel alignment

Laravel documents that `belongsTo` derives a default foreign key from the relationship method and parent key, while `hasOne`/`hasMany` derive the related-table foreign key from the parent model; explicit foreign/local keys can override these conventions. The identity boundary therefore needs to converge convention and explicit representations after semantic reconciliation.

## Dataflow boundary remains unchanged

No migration-to-dataflow solver or graph-dataflow solver is introduced. Structural lineage remains:

```text
MigrationInterface
  -> SchemaInterface
  -> SchemaRelation
  -> ModelSemanticRelation
  -> GraphSemanticRelation
  -> GraphEdgeRelationSink
  -> ServiceGraph.edgeRelations
```

Runtime/value flow remains:

```text
SemanticDataflowInput
  -> SemanticDataflowJudgment
  -> SemanticDataflowInterface
  -> SemanticDataflowIRProjection
```

The CodeQL model supports this separation: data-flow nodes are a semantic graph representation distinct from AST nodes, and global data flow is computed by a dedicated generic solver/configuration. RouteSync should keep its one existing semantic dataflow authority rather than deriving a second closure from migration/schema/graph facts.

## Executable proof

`model-relation-identity-stability.phase995.test.ts` proves that convention and explicit forms of the same `belongsTo` relation reconcile to the same identity key.

The Phase 995 audit additionally verifies the ecommerce migration/model witness and the absence of newly introduced migration/graph dataflow solvers.

## Next upstream frontier

1. Extend the identity stability proof across `belongsTo`, `hasMany`, and `hasOne` with both convention and explicit keys.
2. Add identity normalization for any future through/polymorphic relation forms only when their complete semantic key is modeled; do not force ordinary foreign-key inference onto those relations.
3. Audit every graph producer so it only projects already-canonical upstream relations and never performs schema/Eloquent semantic inference downstream.
4. Keep `SemanticDataflowInterface` as the sole closure authority and let IR remain a projection.
5. Run the complete migration → schema → model → manifest → graph/dataflow → IR E2E suite when workspace dependencies are available.

## Validation

Passing audits:

- Phase 991 upstream graph/dataflow boundary
- Phase 992 final graph provenance
- Phase 993 graph relation identity
- Phase 994 model relation identity
- Phase 995 model relation identity stability

Full TypeScript/Vitest execution remains dependency-limited in this workspace because the global TypeScript compiler reports missing `node` and `vitest/globals` type definitions.

Legacy files remain physically present; unused legacy scanner files are not deleted and remain empty according to the project policy.
