# Resource Producer — Trace / Saran / Perbaiki

## Source of truth

`examples/ecommerce-shop-source/app/Http/Resources/*.php`

Laravel API Resource semantics were checked against Laravel 13 documentation. The ecommerce source currently uses `JsonResource`, `toArray()`, `$wrap`, `@mixin`, nested resource / collection, ordinary expressions, assignments, and `whenLoaded`.

## Canonical dataflow

```text
Laravel Resource source
  -> PHP AST
  -> ResourceScanner.scanAsts
  -> upstream OriginModelSymbol
  -> ResourceProducer
  -> ResourceField / ResourceDefinition
  -> ResourceAst
```

## Removed producer-side reclassification

Before:

```text
ResourceProducer
  -> ResourceModelResolver
  -> relationPropagationMap / model symbol table
  -> buildResourceField
  -> ResourceAst
```

After:

```text
ResourceScanner
  -> obtains the upstream model symbol by resource/model convention
  -> ResourceProducer receives that model datum
  -> ResourceProducer constructs ResourceAst
```

`ResourceProducer` no longer receives `ModelSymbolTable`, `relationPropagationMap`, or controller dataflow and no longer invokes `ResourceModelResolver`.

## Datum audit against ecommerce_shop

### OrderResource

- `$wrap = null` -> `unwrapped`
- local assignments -> `Assignments`
- scalar property projections -> `ResourceField`
- nullsafe / coalesce / cast / binary expressions -> `Expression`
- `OrderDetailResource::collection(...)` -> `resource_collection`
- nested arrays -> `nested_object`
- `toArray(Request $request): array` -> `ResourceTransformation`

### OrderDetailResource

- `$produk` assignment -> `Assignments`
- nullsafe property traversal -> `Expression`
- ternary -> `Expression`
- `asset(...)` -> `Expression`
- nested `produk` object -> `nested_object`
- multiplication -> `Expression`

### PaymentResource

- local assignments -> `Assignments`
- nullsafe traversal -> `Expression`
- array guard / lookup -> `Expression`
- `OrderDetailResource::collection(...)` -> `resource_collection`
- `whenLoaded('order', ...)` -> `when_loaded` operation

### ProdukItemResource

- mixin -> `ResourceDocumentation.mixins`
- nullsafe traversal -> `Expression`
- casts -> `Expression`
- conditional expression -> `Expression`
- model property projections -> `ResourceField`

## Saran yang diterapkan

1. Producer input harus contain semantic datum already produced upstream, not a resolver context.
2. Controller evidence must not be required to create ResourceAst.
3. Relation propagation must not be a hidden ResourceProducer input.
4. Missing upstream model meaning must remain an explicit failure/diagnostic, not silently become `unknown`.
5. Do not add a duplicate ResourceAst vocabulary for these cases.

## Verification limitation

Full repository TypeScript compilation remains blocked by missing ambient type packages in the workspace (`@types/node` and other `@types/*`). This is an environment/dependency gate, not a claimed successful full compile.
