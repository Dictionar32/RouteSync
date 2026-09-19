# Phase 124 - High Model Upstream Interface Trace: ecommerce_shop

## Boundary yang ditelusuri

`ecommerce_shop source -> PHP AST -> ResourceFieldExpression -> ResourceExpressionModel -> ResourceBindingModel -> ResourceTraversalModel -> Eloquent Model Surface -> method semantics`

Downstream generator/emitter tidak disentuh.

## Temuan trace

1. `ResourceModelSurface` sebelumnya hanya membawa members model. Informasi query-builder dan terminal method masih harus ditebak dari `MethodName` downstream.
2. `ResourceBindingModelFactory` membangun method step, tetapi semua method berakhir sebagai `unknown`/`unresolved`; akibatnya `query() -> latest() -> first()` dan `query() -> paginate()` kehilangan state model dan cardinality.
3. Binding variable seperti `$query = ProdukItem::query(); $produk = $query->get();` belum mengangkat origin expression menjadi traversal root model.
4. Resource collection merupakan boundary domain tersendiri. `OrderResource::collection($orders)` dan `ProdukItemResource::collection($produk)` tidak boleh diperlakukan sebagai sekadar pemanggilan method biasa.
5. `ResourceExpressionBindingRequirement.variable` masih menggunakan `string`, sehingga vocabulary variable belum tertutup.

## Perbaikan upstream

### 1. Eloquent method surface

Ditambahkan `resourceModelMethodSurface.ts` dengan ADT:

- `ResourceQueryState`: `model_instance | query_builder`
- `ResourceMethodResult`: `query_builder | single_model | model_collection | paginated_collection | scalar | unsupported`
- `ResourceModelMethodKind`: `query_origin | query_mutation | single_model | model_collection | paginated_collection | scalar | unknown`
- `ResourceModelMethodSurface`: state + descriptor methods

Semantics penting:

- `Model::query()` -> query builder model yang sama.
- `where/with/latest/orderBy/...` -> query builder model yang sama.
- `first/find/firstOrFail/findOrFail` -> single model.
- `get/all` -> model collection.
- `paginate/simplePaginate/cursorPaginate` -> paginated collection.
- `exists/count/sum/value/pluck` -> scalar.

Laravel mendokumentasikan `paginate()` sebagai operasi query/Eloquent yang menghasilkan paginator, dan resource collection menerima paginator sebagai input. citeturn0search7turn0search0

### 2. Traversal state propagation

`ResourceBindingModelFactory` sekarang mengalirkan `ResourceQueryState` antar method step. Target dan cardinality tidak lagi selalu `unresolved`:

`ProdukItem::query()->with(...)->latest()->get()`

menjaga model `ProdukItem` sampai terminal `get()` dan menghasilkan `model_collection`.

`Promo::query()->latest()->first()`

menjaga model `Promo` sampai terminal `first()` dan menghasilkan `single_model`.

`ProductReview::query()->latest()->paginate($perPage)`

menghasilkan `paginated_collection` sambil mempertahankan argument expression `$perPage`.

### 3. Variable-origin lifting

Jika variable mempunyai tepat satu definition, traversal dapat mengangkat definition tersebut sebagai origin:

`$query = ProdukItem::query();`

`$produk = $query->get();`

menjadi satu flow semantic yang berakar pada `ProdukItem`, bukan root variable anonim.

Jika definition ambigu atau cyclic, model tidak mengarang asal. State tetap unresolved.

### 4. Vocabulary variable

`ResourceExpressionBindingRequirement.variable.name` sekarang memakai `VariableName`, bukan `string`.

## Data source ecommerce_shop yang memvalidasi model

Trace source menemukan pola nyata:

- `Order::where(...)->with(...)->latest()->get()` lalu `OrderResource::collection($orders)`.
- `Order::where(...)->with(...)->findOrFail(...)` lalu `new OrderResource($order)`.
- `PromoCode::where(...)->lockForUpdate()->latest()->first()`.
- `ProductReview::where(...)->latest()->paginate($perPage)`.
- `ProdukItem::query()->with(...)->where(...)->get()` lalu `ProdukItemResource::collection($produk)`.

## Boundary yang masih belum boleh dilewati

1. Resource collection wrapper harus masuk ke model upstream sebagai ADT lengkap: resource identity + input binding + collection/pagination semantics.
2. Relation method seperti `$order->details()->where(...)->first()` perlu dibedakan dari query-builder method biasa. Relation surface harus membawa source model, relation identity, target model, dan cardinality sebelum terminal method diproses.
3. Model members masih memiliki beberapa primitive fields dari parser lama, khususnya `ParsedColumn.name/propertyName`. Itu perlu dinaikkan menjadi value object di boundary parser, bukan diperbaiki downstream.
4. Model method registry saat ini adalah semantic registry, bukan klaim bahwa semua Laravel methods telah dipetakan. Method yang belum dikenal tetap `unsupported`, bukan fallback.

## Status

**Upstream interface repair berlanjut. Downstream belum disentuh.**

Urutan berikutnya yang benar:

`Model Surface -> Relation Method Surface -> Resource Collection Boundary -> BoundSemanticNode`

Bukan langsung ke generator. Manusia sudah cukup lama menderita karena compiler yang menebak-nebak data di hilir.
