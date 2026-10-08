# Phase 62 — Route Middleware Reference ADT

## Tujuan

Menaikkan representasi middleware Laravel satu tingkat lagi ke upstream:
parameter middleware tidak lagi dibawa sebagai satu string opaque sampai
interface flow.

Laravel mendukung middleware dengan parameter menggunakan pemisah `:` dan
parameter tambahan dipisahkan dengan koma. Contoh resmi Laravel mencakup
`auth:sanctum` dan middleware dengan beberapa parameter. citeturn0search0turn0search7

## Perubahan

- Menambahkan `RouteMiddlewareReference`:
  - `name: MiddlewareName`
  - `parameters: readonly StringValue[]`
- `RouteMiddlewareContract` dan exclusion sekarang membawa reference tersebut.
- `normalizeMiddlewareReference()` memecah `name:arg1,arg2` di upstream.
- `resolveRouteMiddlewareFlow()` sekarang menerima `RouteMiddlewareSemanticInput`, bukan `RouteDeclarationAst`.
- Menambahkan `routeMiddlewareSemanticInputFromAst()` sebagai adapter eksplisit AST → ADT.
- `RouteSemanticFlow` tidak berubah dan tetap AST-free.
- Tidak mengklaim parameter sebagai nilai typed; nilainya tetap string karena tipe runtime middleware ditentukan oleh middleware itu sendiri.
- Tidak mengklaim array contract sebagai execution order; Laravel memiliki mekanisme sorting/priority middleware.

## Jalur

```text
Laravel source
  -> route AST
  -> routeMiddlewareSemanticInputFromAst()       [AST -> ADT]
  -> RouteMiddlewareReference + scope + provenance
  -> resolveRouteMiddlewareFlow()                [ADT -> ADT]
  -> RouteSemanticFlow                            [AST-free]
  -> dumb interface flow / consumer
```

Dengan demikian AST tetap menjadi tanggung jawab upstream dan tidak bocor ke
interface flow.
