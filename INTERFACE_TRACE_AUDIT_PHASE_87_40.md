# RouteSync Interface Trace Audit — Phase 87.40

## Objective
Menaikkan semantic model satu tingkat lagi: metadata Eloquent yang masuk ke resolver harus berupa closed ADT, dan operasi array yang diketahui tidak boleh otomatis kehilangan model menjadi `unknown`.

## Trace
Laravel AST
  -> Verified ModelNode / ModelAccessor
  -> ResolverMeta
  -> SemanticResolutionKernel
  -> EloquentReturn ADT
  -> SemanticResolution
  -> BoundSemanticNode
  -> RouteSync IR

## Changes
1. `EloquentMethodRule.returns` diubah dari string union + optional flags menjadi discriminated `EloquentReturn`.
2. `model` membawa `collection` dan `paginated` secara eksplisit.
3. `builder`, `number`, `boolean`, dan `array` menjadi variant tertutup.
4. `toArray()` dan `jsonSerialize()` sekarang membawa `element: model`, sehingga chain pada model tidak langsung jatuh ke `unknown`.
5. `resolveInstanceMethodCall()` melakukan dispatch berdasarkan `returns.kind`, bukan string + optional fields.
6. `pluck()` tetap eksplisit sebagai array dengan element `unknown`, karena tipe elemen memang bergantung pada argumen PHP yang belum dimodelkan. Ini adalah unresolved semantic state, bukan fallback generator.

## Important ecommerce-shop implication
Trace sebelumnya menunjukkan chain seperti `ProductReview::where()->with()->latest()->paginate()` berhasil menjadi model collection paginated, sedangkan operasi array generik dapat kehilangan informasi. Phase ini menutup kehilangan tersebut untuk operasi yang secara semantik diketahui (`toArray`, `jsonSerialize`).

## Remaining P0/P1
- Response origin `RegisterResponse.data` masih perlu ditelusuri sampai sumber Laravel Resource/response expression agar tidak menjadi `unknown` terlalu awal.
- `ResolutionContext` masih menggunakan `Record<string, ...>` untuk assignment/resolution lookup.
- `ExpressionNode` masih memiliki `[key: string]: unknown`.
- Legacy duplicate `ModelNode` di `types/semantic/modelGraphTypes.ts` masih harus dimigrasikan setelah seluruh consumer ditrace.
- `ResourceFieldKind` / `ResponseMetadata` legacy surface perlu dihapus setelah adapter consumers habis.

## Invariant
Tidak boleh ada aturan downstream yang berbunyi:
`unknown -> coba model -> fallback`.

Yang benar:
`Laravel fact -> typed ADT -> semantic resolution -> IR -> lowering`.
