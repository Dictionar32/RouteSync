# Collection Response Implementation

## Baseline

Pada 2026-08-26, `npx vitest run` mencatat gap di lowering
`manifestToContractInput`:

- `kind: 'array'` pada field non-resource jatuh ke `ReferenceType` dan akhirnya
  menjadi `z.unknown()`.
- Inline response `{ kind: 'object', collection: true }` kehilangan semantik
  collection.
- Response `{ kind: 'unknown' }` tidak masuk ke `requestTypes` bila route tidak
  memiliki action.

Kegagalan assertion lama yang memeriksa `ReadonlyCollectionType.kind` terhadap
`CollectionKind.ARRAY` bukan gap lowering: `kind` adalah
`'readonly_collection'`; properti yang benar adalah `collectionKind`.

## Kontrak manifest dan lowering

`ResourceFieldKind` menerima bentuk rekursif berikut, yang juga sah dipakai
sebagai field di dalam inline object response:

```ts
{ kind: 'array', element: ResourceFieldKind }
```

- Array diturunkan menjadi
  `ReadonlyCollectionType(CollectionKind.ARRAY, mappedElement)`.
- `element` dipetakan secara rekursif, sehingga primitive, object, resource,
  dan array bersarang tetap mempertahankan bentuknya.
- Jika payload runtime tidak memiliki elemen array yang dapat dipetakan, array
  tetap dipertahankan dengan elemen unknown; informasi bahwa payload adalah
  array tidak boleh hilang.
- `collection: true` yang sudah ada untuk `resource` atau `resolved.resource`
  tetap menggunakan jalur resource collection yang ada.

Tidak ada varian top-level `response.kind: 'array'` dalam perubahan ini.
Untuk inline response array, bentuk yang didukung adalah
`{ kind: 'object', collection: true, fields: ... }`.

## Response behavior

- Inline object biasa tetap menurunkan field langsung ke `responseData.fields`.
- Inline object collection menggunakan nama response sintetis yang sama, tetapi
  menulis `responseData.fields.data` sebagai array dari `ObjectType(fields)`.
- Response unknown tetap menghasilkan `RequestType` dengan response sintetis
  dan `fields: {}`. Implementasi tidak mengarang model atau skema response.

## Scope dan verifikasi

Perubahan terbatas pada kontrak manifest legacy dan lowering
`manifestToContractInput`. `PrimitiveTypeRegistry` serta import
`MapperGeneratorPass` tidak termasuk karena merupakan kegagalan independen.

Verifikasi mencakup regression array/inline response, E2E contract generation,
response `RegisterResponse`, dan regression resource collection untuk menjamin
jalur yang telah ada tidak berubah.

## Hasil verifikasi — 2026-08-26

- Lima suite yang mencakup perubahan ini lulus: **34/34 test**.
- Full `npx vitest run`: **65 file lulus, 3 file gagal; 898/901 test lulus**.
  Dua kegagalan yang konsisten berada di `PrimitiveTypeRegistry`, dan satu
  suite tidak dapat diimpor karena `MapperGeneratorPass` tidak ada.
- Satu kegagalan tambahan pada benchmark `FileSpan` muncul hanya pada full
  suite. Saat dijalankan terisolasi, file tersebut lulus **31/31**, sehingga
  tetap diklasifikasikan sebagai flaky dan di luar scope perubahan collection.
- `npx tsc --noEmit` masih gagal karena error baseline lintas proyek. Tidak ada
  error baru pada deklarasi manifest yang diubah; error lama pada lowering
  ternary di `manifest-to-types.ts` tetap ada.
