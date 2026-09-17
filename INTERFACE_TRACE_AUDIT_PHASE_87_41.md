# RouteSync Interface Trace Audit — Phase 87.41

## Objective
Menaikkan model upstream Eloquent dari metadata yang porous menjadi closed transition ADT, sekaligus memastikan query-builder chain mempertahankan identitas model yang sudah diverifikasi.

## Trace
Laravel PHP AST
  -> FieldNode (syntax only)
  -> SemanticResolutionKernel
  -> verified ModelNode
  -> EloquentReturn ADT
  -> SemanticResolution
  -> BoundSemanticNode
  -> RouteSync IR
  -> pure lowerers
  -> emitters

## Changes
1. `ELOQUENT_METHOD_REGISTRY` menggunakan `ReadonlyMap`, bukan `Record<string, Rule>`.
2. `EloquentMethodRule` tidak lagi mempunyai `collection?` / `paginated?` terpisah.
3. Model return membawa cardinality sebagai closed literal union dan pagination sebagai fakta wajib.
4. Query-builder `builder` diperlakukan sebagai pass-through semantic state: model, cardinality, dan pagination berasal dari target yang sudah terverifikasi.
5. `FieldNode` tetap syntax-only; semantic binding berada di `FieldBinding`.

## Why
Sebelumnya sebuah rule dapat memiliki kombinasi yang tidak konsisten:
`returns.model` + `collection?` + `paginated?`.
Sekarang satu discriminator menentukan bentuk return dan payload yang diwajibkan oleh bentuk tersebut.

## Ecommerce-shop relevance
Chain seperti:
`ProductReview::where(...)->with(...)->latest()->paginate()`
harus mempertahankan model `ProductReview` dari static model origin sampai `paginate()` tanpa fallback string/unknown.

`selectRaw(...)->first()` tetap menggunakan QueryProjection ADT dan bukan generic model fallback.

## Remaining P0
`RegisterResponse.data -> unknown` masih harus ditrace dari response-expression origin. Generator tidak boleh mengisi ulang tipe tersebut dari model fallback.

## Remaining P1
- `ResolutionContext` lookup records -> typed collection/value object.
- `ExpressionNode` `[key: string]: unknown` -> closed PHP expression ADT.
- legacy response/resource compatibility surfaces -> adapters only.
- migrate remaining consumers away from `unknown` field probing.
