# Phase 94 — ecommerce_shop Interface-First Upstream Trace

## Goal
Memperbaiki kontrak interface terlebih dahulu agar semantic data tidak hilang sebelum downstream.

## Trace
Laravel source → scanner → domain interface → manifest/IR → lowerer.

## Findings
- Domain interfaces masih menggunakan primitive bebas untuk identity yang sudah memiliki vocabulary.
- Route identity/binding/provenance belum seluruhnya memakai semantic value types.
- Endpoint contract masih menyimpan identity sebagai string.
- Model/resource contracts masih membawa `any`, raw string identity, dan table name tanpa domain meaning.
- Semantic relations memiliki legacy porous alias dengan optional fields.
- RequestField menyimpan `nullable: boolean` sebagai semantic state terpisah.

## Fix
- Menghubungkan route, endpoint, model/resource, handler, request, dan relation interfaces ke domain vocabulary/closed ADT yang sudah ada.
- Menghapus legacy porous SemanticRelation alias dan menjadikannya alias ke closed SemanticRelationContract.
- Menghapus free `string` untuk controller/action/model/resource/route/path/source identity pada interface yang disentuh.
- Mengubah RequestField nullability menjadi canonical Nullability ADT.
- Menghapus free-string FormActionName extension.

## Data integrity rule
Primitive tetap diperbolehkan di raw/source boundary dan untuk nilai teknis yang memang primitive. Primitive tidak boleh menjadi pembawa makna domain.

## Validation limitation
Basis Phase 93 tidak menyediakan root package.json/tsconfig. Karena itu full repository build tidak diklaim. Static source audit dilakukan pada core source.
