# Phase 988 — Semantic Provenance Identity

Phase 988 memperketat dua boundary yang sudah canonical tanpa membuat solver baru.

## Migration → schema → relation → graph

`MigrationProvenance` sekarang membawa `MigrationOperationProvenance` dengan:

- operation kind (`create_table`, `alter_table`, `drop_table`, `raw`);
- semantic table identity bila tersedia;
- operation index dalam migration.

Schema production menempelkan provenance operasi yang tepat pada setiap `ForeignKey`. `SchemaForeignKeyEvidence` memprioritaskan provenance FK tersebut, sehingga `ModelRelationProvenance` tidak lagi hanya menunjuk seluruh histori table.

Untuk fixture `OrderDetail`, bukti canonical tetap:

`foreignId('order_id')->constrained()` → FK `order_id -> orders.id` → `belongsTo(Order::class)` → model relation provenance → graph relation lineage.

## Dataflow → IR

`SemanticDataflowOrigin.identity` sekarang membawa `SemanticDataflowIdentity` aktual. Adapter controller mengisi identity dari node canonical, dan fallback interface memakai `judgment.node`.

Dengan demikian lineage tidak lagi memakai string marker `typed_semantic_dataflow_identity` yang tidak mengidentifikasi node tertentu.

## Authority

Tidak ada `MigrationDataflowSolver`, `ModelRelationDataflowSolver`, atau solver kedua. Fixed-point dataflow tetap berada pada canonical `SemanticDataflowAuthority`.

Manifest tetap menjadi flow surface untuk controller-scoped dataflow inputs. Graph relation provenance dan dataflow lineage tetap merupakan dua projection yang typed dan terpisah.

Legacy `packages/core/src/compiler/scanner/subscanners/model/migrationScanner.ts` tetap dipertahankan secara fisik dan tetap kosong.
