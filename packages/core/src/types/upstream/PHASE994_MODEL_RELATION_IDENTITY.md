# Phase 994 — Upstream Model Relation Identity

Phase 994 memperkuat identity semantik `ModelSemanticRelation` tanpa membuat interface atau solver baru.

## Perubahan

`ModelSemanticRelation` sekarang membawa `ModelSemanticRelationIdentity` yang hanya memuat semantic identity:

- source model;
- relation property/name;
- target model;
- Eloquent relation type;
- canonical relation key.

Identity sengaja tidak memuat `SourceSpan`, AST evidence, atau provenance migration. Provenance tetap lineage evidence dan bukan identity.

`modelSemanticRelationIdentityKey()` menjadi key deterministik untuk kebutuhan relational dedup downstream.

## Graph

`GraphEdgeRelationSink` tetap menjadi satu-satunya graph-edge materialization authority. Untuk relation dengan provenance `model_relation`, dedup key sekarang memasukkan canonical model-relation identity selain endpoint, edge type, weight, dan origin.

Dengan demikian dua model relations yang kebetulan mempunyai endpoint/type/origin sama tetapi semantic identity berbeda tidak dilipat menjadi satu relation.

## Ecommerce proof

Fixture `examples/ecommerce-shop-source` tetap membuktikan:

```text
order_details.order_id
  -> orders.id
  -> OrderDetail::belongsTo(Order::class)
  -> ModelSemanticRelation.identity
  -> ModelRelationProvenance
  -> GraphSemanticRelation
  -> ServiceGraph.edgeRelations
```

Migration provenance tetap disimpan sebagai lineage dan tidak dicampurkan ke relation identity.

## Dataflow boundary

Tidak ada `MigrationDataflowInterface`, `MigrationDataflowSolver`, `GraphDataflowSolver`, atau solver kedua. Runtime/value dataflow tetap berada pada `SemanticDataflowAuthority`, sedangkan migration/schema/model relation tetap merupakan structural semantic lineage.

## Validation

- Phase 991 audit: clean.
- Phase 992 audit: clean.
- Phase 993 audit: clean.
- Phase 994 model-relation identity audit: clean.
- Global `tsc --noEmit -p tsconfig.json` masih terhalang dependency workspace yang tidak tersedia: `@types/node` dan `vitest/globals`.
- Legacy `packages/core/src/compiler/scanner/subscanners/model/migrationScanner.ts` tetap ada dan 0 bytes.
