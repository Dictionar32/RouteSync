# RouteSync — ecommerce_shop Source → Upstream High-Level Model

## Source boundary

`ecommerce_shop` dipakai hanya sebagai Laravel source/fixture. Latest scanner tetap menjadi origin boundary. Legacy manifest tidak dipakai untuk mendesain interface.

Source yang dianalisis dari Library: `ecommerce_shop-main (8).zip`.

## Source inventory

| Source domain | Observed |
|---|---:|
| Eloquent Models | 19 |
| API Resources | 4 |
| FormRequests | 8 |
| Controllers | 11 |
| Migrations | 25 |
| API route declarations | 34 |
| Web route declarations | 1 |

## Facts that drove the interface

### Model

Source nyata menunjukkan bukan hanya `name + fields`, tetapi:

- database columns dan nullability
- enum/status vocabulary
- primary/foreign keys
- fillable/hidden/appended surface
- casts
- computed accessors
- `BelongsTo`, `HasMany`, `HasOne` relations
- relation cardinality
- model inheritance

Contoh: `Order` memiliki `user`, `details`, `payment`, `shipping`, `promotion`, `amount`, `financial`, `fulfillment` dengan cardinality yang berbeda.

### Resource

Resource nyata melakukan semantic projection, bukan sekadar field map.

`OrderResource` memproyeksikan model `Order` dan menggabungkan data dari `payment`, `financial`, `fulfillment`, `amount`, `promotion`, `shipping`, serta collection `OrderDetailResource`.

`ProdukItemResource` memproyeksikan `ProdukItem`, `frontend`, dan `category`, termasuk computed fields seperti `image_url`, `category_name`, `rating`, dan `review_count`.

Karena itu `ResourceFieldSemantic` sekarang membawa:

```text
identity
expression
meaning
result type
presence
source
```

### Request

Source memiliki validation contract nyata seperti:

```text
required|string|max:255
required|email|unique:users,email
sometimes|array|min:1
required_with:items
exists:produk_items,id
nullable|string
```

Maka `RequestFieldContract` sekarang membawa:

```text
name
input target
presence
TypeExpression
ValidationRules
source
```

Validation tidak disimpan sebagai rule string di canonical model.

### Response

Source memiliki beberapa bentuk response:

- resource response
- resource collection
- inline object response
- primitive/value response
- empty response
- declared DTO response (`RegisterResponse`)

Maka response sekarang dipisah menjadi:

```text
ResponseShape
ResponsePayloadContract
EndpointResponseBinding
```

### Route

`routes/api.php` memiliki route public, authenticated, admin, route parameter, middleware, `Route::match`, controller/action target, dan endpoint yang memakai FormRequest maupun raw `Request`.

Karena tidak semua endpoint mempunyai FormRequest atau declared response, absence tidak direpresentasikan dengan `null`/`undefined`.

Canonical model memakai:

```text
EndpointRequestBinding
├── form_request
├── inline_input
└── no_input

EndpointResponseBinding
├── declared_response
├── inline_response
└── empty_response
```

## New high-level upstream interfaces

### Typed references

`semanticReferences.ts`

```text
ModelReference
ResourceReference
RequestReference
ResponseReference
RouteReference
PropertyReference
SourceReference
```

Identifier tidak lagi dipertukarkan sebagai primitive string.

### High-level semantic contracts

`highLevelContracts.ts`

```text
ResourceFieldSemantic
RequestFieldContract
ResponseShape
ResponsePayloadContract
RouteEndpointContract
```

### Complete source model

`highLevelSourceModel.ts`

```text
CompleteLaravelSourceModel
├── identity
├── catalog
│   ├── models
│   ├── resources
│   ├── requests
│   ├── responses
│   └── routes
└── references
```

Ini adalah level model yang dimaksudkan sebagai boundary sebelum downstream compiler.

## Invariants

```text
Source fact preservation
No primitive identifier leakage
No semantic null/undefined
No Record-based semantic graph
No downstream source reparse
No downstream meaning reconstruction
No duplicate lookup by raw string
```

## Verification

`tsconfig.phase87.33.narrow.json` dijalankan setelah penambahan model.

Result:

```text
New upstream high-level model → no diagnostics
Existing unrelated diagnostic → compiler/utils/Hash.ts: crypto typings
```

`Hash.ts` tidak disentuh karena merupakan environment/type-declaration issue, bukan interface source-model issue.
