# Investigasi Test Suite — RouteSync (2026-08-24)

## Ringkasan

Baseline awal (sebelum perbaikan apapun): **725 passed, 11 failed** dari test yang berhasil di-collect,
plus 16 file gagal resolve modul (`@routesync/core` belum di-build).

Setelah `npm install --legacy-peer-deps` + `npx tsup` (build root package), baseline naik jadi
**839 passed, 11 failed, 5 skipped** dari 855 total — seluruh masalah resolusi modul hilang.

Setelah menambahkan test regression baru (`register-response-contract.regression.test.ts`) dan
mengembalikan 2 file regression collection yang sempat tertinggal di satu upload ZIP
(`manifest-to-contract.e2e-regression.test.ts`, `manifest-to-types.collection-regression.test.ts`):
**840 passed, 11 failed, 5 skipped** dari 856 total.

Setelah memperbaiki syntax error di `ContractGeneratorPass.test.ts` (lihat detail di bawah):
**869 passed, 11 failed, 5 skipped** dari 885 total, di 65 file — **semua file berhasil di-collect**.

Setelah memperbaiki assertion salah-target di `FormGeneratorPass.test.ts` (lihat detail di bawah):
**870 passed, 10 failed, 5 skipped** dari 885 total.

Baseline final saat ini: **10-11 test gagal di 5 file** (jumlah persis bervariasi ±1 antar run karena
`FileSpan.test.ts` bersifat flaky, sudah dikonfirmasi lewat pengujian ulang), **seluruhnya sudah
diinvestigasi tuntas** (tidak ada lagi item "belum diinvestigasi"). Rincian per akar masalah:
- 5 test — known limitation desain IR collection (butuh implementasi baru, sudah ada kontrak jelas)
  di 3 file: `manifest-to-contract.e2e-regression.test.ts`, `manifest-to-types.collection-regression.test.ts`,
  `manifest-to-types.test.ts`
- 2 test — bug asli terkonfirmasi (`normalizePrimitiveKind` di `SemanticType.ts`), di
  `PrimitiveTypeRegistry.test.ts`
- 0-1 test — flaky terkonfirmasi lewat pengujian ulang berkali-kali (`FileSpan.test.ts`, tidak perlu
  diubah)
- 1 test — environment issue terkonfirmasi (PHP tidak ada di sandbox ini), di `laravelParser.spec.ts`

---

## Status per area

| Area | Status | Jumlah test | Root cause sudah ditemukan? |
|---|---|---|---|
| `register-response-contract.regression.test.ts` | ✅ pass | 2/2 | — (test baru, membuktikan jalur resource-based aman) |
| `ContractGeneratorPass.test.ts` | ✅ fixed | 29/29 | ✅ ya (syntax fixture rusak) |
| Inline/response-level collection (3 file) | ⚠️ known limitation | 5 | ✅ ya (lihat bagian Collection) |
| `PrimitiveTypeRegistry.test.ts` | 🔴 bug asli terkonfirmasi | 2 | ✅ ya (lihat bagian PrimitiveTypeRegistry) |
| `FormGeneratorPass.test.ts` | ✅ fixed | 24/24 | ✅ ya (bug test, bukan source — lihat bagian FormGeneratorPass) |
| `FileSpan.test.ts` | ⚠️ flaky terkonfirmasi | 0-1 | ✅ ya (lihat bagian 5) |
| `laravelParser.spec.ts` | ⚠️ environment terkonfirmasi | 1 | ✅ ya (lihat bagian 6) |

---

## 1. `ContractGeneratorPass.test.ts` — syntax fixture rusak (FIXED)

**Sebelum**, sekitar baris 868-880:
```ts
metadata: { ... }
}

const pass = new ContractGeneratorPass()
const result = await pass.run([artifact])   // run() tidak async

const generated = result[0]                  // result bukan array, tapi objek tunggal
expect(generated.contracts).toContain(...)   // .contracts adalah array info, bukan string
```

Masalah:
1. `metadata: { ... }` — literal `...` bukan JS/TS valid, menyebabkan file gagal di-*collect* sama sekali
   (parse error di baris 872), sehingga 29 test lain di file yang sama juga tidak pernah jalan.
2. `pass.run()` bersifat sinkron (lihat signature `ContractGeneratorPass.ts:131`), bukan `Promise` — pemakaian
   `await` salah, walau tidak fatal (await pada non-Promise tetap resolve).
3. Kontrak return `run()` adalah `ResolveArtifacts<readonly ['GeneratedContract']>` — tuple satu elemen,
   dipakai dengan pola destructuring `const [result] = pass.run([artifact])` di semua test lain pada file
   yang sama. Test yang rusak salah menganggap `result` sendiri adalah array (`result[0]`).
4. `GeneratedContractArtifact.contracts` bertipe `readonly GeneratedContractInfo[]` (metadata kontrak),
   **bukan string** — source code hasil generate ada di field `.code`.

**Perbaikan** (murni test fixture, tidak menyentuh source):
```ts
metadata: {
    hash: 'test-hash',
    producer: 'test',
    dependencies: [],
    timestamp: Date.now(),
    revision: '1.0.0'
}
}

const pass = new ContractGeneratorPass()
const [result] = pass.run([artifact])

expect(result.code).toContain('paymentConfirmShow');
expect(result.code).toContain('success: z.boolean()');
expect(result.code).toContain('message: z.string()');
```

Pola `metadata` disalin persis dari test lain di file yang sama (baris ~117) untuk konsistensi.
Hasil: **29/29 pass**, tidak ada regresi ke test lain di file tersebut maupun full suite.

---

## 2. Inline / response-level collection — baseline historis (diimplementasikan 2026-08-26)

> **Status terbaru:** seluruh gap collection di bagian ini telah diimplementasikan
> pada `manifestToContractInput`; lihat
> `COLLECTION_RESPONSE_IMPLEMENTATION.md` untuk kontrak dan hasil verifikasi.
> Assertion lama `addressesCollection.kind === CollectionKind.ARRAY` bukan
> limitation fungsional: properti yang benar adalah `collectionKind`. Assertion
> tersebut telah dikoreksi secara terpisah dari perubahan lowering.

Bagian berikut menyimpan akar masalah dan kontrak target sebagai catatan
baseline sebelum implementasi.

Ditemukan di 3 file:
- `manifest-to-contract.e2e-regression.test.ts` (3 gagal)
- `manifest-to-types.collection-regression.test.ts` (3 gagal, salah satunya sama kasusnya dengan file di atas)
- `manifest-to-types.test.ts` (1 gagal, `should handle nested collection of objects`)

### Gap 1 — Field ber-`collection`/`kind: 'array'` yang bukan resource reference

`mapResourceFieldToNestedType()` di `manifest-to-types.ts` (baris 896-1018) hanya membaca flag
`collection`/`resolved.collection` di dua tempat: dalam `resolved.type === 'resource'` dan di
`case 'resource'`. Cabang `case 'primitive'` dan `case 'object'` **tidak pernah membaca `field.collection`**.

Test menuntut **field kind baru**, `'array'`, dengan bentuk:
```ts
{ kind: 'array', element: <ResourceFieldKind> }   // rekursif, bisa array<array<object>>
```
Field seperti ini saat ini jatuh ke `default` branch (baris 1011) → jadi `ReferenceType`, bukan
`ReadonlyCollectionType`.

### Gap 2 — Response-level `collection: true`

Branch `else if (response.kind === 'object' && response.fields)` (baris 330, `manifestToContractInput`)
tidak pernah membaca `response.collection`. Test menuntut: kalau response top-level punya
`collection: true`, hasilnya harus muncul di **`responseData.fields.data`** sebagai
`ReadonlyCollectionType(ARRAY, ObjectType(fields))` — bukan langsung field-field response jadi
`ObjectType` polos seperti sekarang.

### Gap 3 — `response.kind === 'unknown'` menyebabkan `TypeError`, bukan cuma assertion gagal

Filter `responseRoutes` (baris 259-265) tidak menyertakan `kind === 'unknown'`. Karena route tanpa
`actions` dan tanpa `responseData` tidak pernah masuk ke `requestTypes` (baris 380), array
`requestTypes` jadi kosong total → `artifact.requestTypes[0]` adalah `undefined` →
`TypeError: Cannot read properties of undefined (reading 'responseData')`.

### Kontrak IR target (dari test, belum diimplementasikan)

| Bentuk manifest | Ekspektasi output |
|---|---|
| Field `{kind:'array', element: <ResourceFieldKind>}` | `ReadonlyCollectionType(ARRAY, <mapped element type>)`, rekursif |
| Response `{kind:'object', collection:true, fields:{...}}` | `responseData.fields.data` = `ReadonlyCollectionType(ARRAY, ObjectType(fields))` |
| Response `{kind:'unknown'}` | `responseData` tetap didefinisikan dengan `fields: {}` (bukan skip route) |

Catatan: jalur **resource collection** (`resolved.collection` / `field.collection` pada
`kind: 'resource'`) sudah bekerja dan terbukti lewat `register-response-contract.regression.test.ts`
(2/2 pass) — perbaikan di atas tidak menyentuh jalur ini.

---

## 3. `PrimitiveTypeRegistry.test.ts` — bug asli, root cause BUKAN di file itu sendiri

Bug sebenarnya ada di `packages/core/src/compiler/types/SemanticType.ts`, fungsi
`normalizePrimitiveKind()` (baris 77-87):

```ts
function normalizePrimitiveKind(value: PrimitiveKindValue): PrimitiveKind {
    if (value === PrimitiveKind.STRING) return PrimitiveKind.STRING;
    if (value === PrimitiveKind.NUMBER) return PrimitiveKind.NUMBER;
    if (value === PrimitiveKind.BOOLEAN) return PrimitiveKind.BOOLEAN;
    if (value === PrimitiveKind.DATETIME) return PrimitiveKind.DATETIME;
    if (value === PrimitiveKind.UNKNOWN) return PrimitiveKind.UNKNOWN;

    return primitiveKindByValue[value];   // <-- silent undefined untuk value tak dikenal
}
```

`primitiveKindByValue` hanya berisi 5 key yang sama persis dengan 5 kondisi `if` di atasnya. Untuk
value yang tidak dikenal (mis. `'unsupported'`, `'invalid'` — dipakai test lewat type-cast paksa),
`primitiveKindByValue[value]` mengembalikan `undefined` **secara diam-diam, tanpa error**.

Efek berantai:
1. `new PrimitiveType('unsupported' as PrimitiveKind).type` → `undefined` (bukan `'unsupported'`)
2. `PrimitiveTypeRegistry.getZodSchema()` throw `PrimitiveNotFoundError(primitiveType.type)` — tapi
   `primitiveType.type` sudah `undefined` sebelum sampai sini
3. Pesan error jadi `"Unsupported primitive type: undefined"` (test mengharapkan `"...unsupported"`)
4. `error.primitiveKind` jadi `undefined` (test mengharapkan `'invalid'`)

**Kesimpulan**: `PrimitiveTypeRegistry.ts` dan `PrimitiveNotFoundError` sendiri sudah benar — mereka
jujur meneruskan `primitiveType.type` apa adanya. Bug ada di layer sebelumnya, `PrimitiveType`
constructor / `normalizePrimitiveKind`, yang membuang nilai asli begitu saja untuk kind yang tak
dikenal.

**Risiko lebih luas**: bug ini berpotensi silent-fail di pemanggil `PrimitiveType` manapun yang
menerima input dari luar (mis. dari IR/manifest hasil parsing yang belum tervalidasi penuh), bukan
cuma memengaruhi 2 test ini.

**Opsi perbaikan** (belum diterapkan, menunggu keputusan):
- **A.** `normalizePrimitiveKind` throw error eksplisit untuk value tak dikenal (fail-fast, tapi
  mengubah kontrak constructor `PrimitiveType` — sekarang bisa throw, sebelumnya tidak pernah).
- **B.** Fallback ke `PrimitiveKind.UNKNOWN` — aman, tapi menyamarkan data yang sebenarnya invalid.
- **C.** Preserve nilai asli (`return value as PrimitiveKind`) — cocok bikin 2 test ini pass persis,
  tapi melanggar closed-enum `PrimitiveKind`.

---

## 4. `FormGeneratorPass.test.ts` — bug test (assertion salah target), BUKAN bug source (FIXED)

Test `'should return single artifact in tuple'`, sebelumnya:
```ts
const [result] = pass.run([artifact], CompilationContext.default())

expect(Array.isArray(result)).toBe(true);   // false — result sudah didestrukturkan, bukan array
expect(result).toHaveLength(1);
expect(result.typeId).toBe('GeneratedForm');
```

`pass.run()` mengembalikan tuple `ResolveArtifacts<['GeneratedForm']>` = `[GeneratedFormArtifact]`
(dikonfirmasi lewat `buildEmptyArtifact()` — `FormGeneratorPass.ts` baris 255-259: `return [artifact]`).
Test sudah benar mendestrukturkan `const [result] = ...`, tapi assertion sesudahnya keliru menganggap
`result` (yang sudah jadi objek tunggal) masih berupa array. Berdasarkan nama test dan urutan
assertion, maksud aslinya jelas: mengecek **tuple hasil `run()` itu sendiri**, bukan hasil
destructure-nya.

Pola bug ini **identik** dengan `ContractGeneratorPass.test.ts` (bagian 1) — kesalahan penulisan test
saat menggabungkan pola destructuring dengan assertion array-check, bukan indikasi kontrak
`run()` berubah.

**Perbaikan** (murni test, tidak menyentuh source):
```ts
const result = pass.run([artifact], CompilationContext.default())

expect(Array.isArray(result)).toBe(true);
expect(result).toHaveLength(1);
expect(result[0].typeId).toBe('GeneratedForm');
```

Hasil: **24/24 pass** di file ini, tidak ada regresi ke full suite.

---

## 5. `FileSpan.test.ts` — flaky terkonfirmasi, BUKAN bug (tidak perlu diubah)

Test `'offsetToPosition should be O(log n) in line count'` (baris 397-408) mengukur waktu eksekusi
`LineMap.offsetToPosition()` untuk 10, 100, 1000 baris, lalu menuntut rasio waktu antar step `< 2x`.

**Verifikasi implementasi**: `offsetToPosition()` (`SourceLocation.ts` baris 54-66) memanggil
`this.binarySearch(offset)` (baris 98-109) — binary search asli (`while (low < high)` membelah
rentang pencarian tiap iterasi). Ini benar-benar `O(log n)`, bukan mislabel dari algoritma linear.
**Tidak ada bug algoritma.**

**Verifikasi empiris**:
- Dijalankan terisolasi (hanya file ini) sebanyak 4x berturut-turut → **4/4 pass**.
- Dijalankan ulang sebagai bagian full suite (65 file paralel) → **tidak muncul lagi di daftar
  gagal** pada run berikutnya (total gagal turun dari 10 ke jumlah yang sama tanpa test ini).

Kegagalan sebelumnya (rasio 2.14 vs threshold `<2`) terjadi hanya saat dijalankan bersamaan dengan
seluruh suite lain — margin ambang batas sangat ketat (2.0) untuk microbenchmark absolut yang
sensitif terhadap kontensi CPU di lingkungan sandbox/CI paralel.

Sebagai catatan tambahan: komentar di test *lain* pada file yang sama (`'LineMap construction should
be O(n) in file size'`, baris 388-392) secara eksplisit menyebutkan bahwa threshold serupa dulu
pernah diperlonggar dari ~100x ke 50x karena *"dulu membuat test selalu flaky gagal"* — mengonfirmasi
maintainer proyek sudah menyadari pola microbenchmark timing-sensitive ini sebelumnya.

**Kesimpulan**: flaky terkonfirmasi lewat pengujian ulang, bukan regresi algoritma. **Tidak
direkomendasikan mengubah source.** Kalau ingin menghilangkan flakiness permanen, opsi test-only:
naikkan threshold rasio (misal `<2` → `<3` atau `<4`, mengikuti pola perlonggaran yang sudah ada di
test tetangganya) — bukan mengubah `binarySearch()`.

---

## 6. `laravelParser.spec.ts` — environment terkonfirmasi (PHP tidak tersedia di sandbox ini)

`LaravelRouteParser.ts` (baris 1052-1057) memanggil PHP interpreter eksternal untuk mem-parsing route
Laravel:
```ts
const { spawnSync } = await import('child_process')
const result = spawnSync('php', ['routesync-extractor-temp.php'], { ... })
```

Sandbox eksekusi ini **tidak punya PHP terinstal**:
```
$ which php
/bin/sh: 1: php: not found
```

Menjalankan test langsung mengonfirmasi ini persis penyebabnya:
```
Failed to parse Laravel routes via PHP script: Error: spawnSync php ENOENT
  code: 'ENOENT', syscall: 'spawnSync php', path: 'php'
AssertionError: expected +0 to be 2
```

Catch block di parser (baris 1090-1094) menelan error apapun dari `spawnSync` (termasuk binary yang
tidak ditemukan) dan **mengembalikan hasil kosong secara silent** (`{ routes: [], models: [],
resources: [] }`) alih-alih melempar error yang jelas ke pemanggil. Ini yang membuat test gagal
dengan pesan generik `expected +0 to be 2`, bukan pesan yang langsung mengarah ke akar masalah
(PHP tidak ada) — meski `console.error` tetap mencetak detail aslinya (yang baru terlihat kalau
dicek langsung, tidak muncul di ringkasan assertion vitest).

**Tidak bisa diverifikasi lebih lanjut** di sandbox ini: domain jaringan yang diizinkan
(`network_configuration`) tidak mencakup repository PHP (apt/PPA dsb.), jadi PHP tidak bisa
diinstal untuk membuktikan apakah test benar-benar pass begitu PHP tersedia.

**Kesimpulan**: **environment issue terkonfirmasi**, bukan bug logic parser maupun manifest. Test
ini kemungkinan besar didesain untuk CI/dev environment yang punya PHP terinstal. Rekomendasi:
- Jalankan ulang test ini di environment yang punya PHP (≥8.x sesuai referensi versi di kode) untuk
  memastikan lulus di sana.
- Kalau memang selalu jalan di CI dengan PHP, tidak perlu ada perubahan apapun — currently expected
  to fail hanya di sandbox tanpa PHP seperti ini.
- Opsional (perbaikan kualitas, bukan urgent): silent-catch di baris 1092-1094 sebaiknya tetap
  mengembalikan info error (mis. lewat field terpisah) alih-alih hanya `console.error`, supaya
  kegagalan seperti "PHP not found" tidak tersamar jadi "0 routes ditemukan" yang terlihat seperti
  bug parsing biasa.

## File yang sudah diubah

- `packages/core/src/compiler/passes/__tests__/ContractGeneratorPass.test.ts` — fix syntax fixture
  (lihat bagian 1).
- `packages/core/src/compiler/passes/__tests__/FormGeneratorPass.test.ts` — fix assertion salah
  target (lihat bagian 4).

**Tidak ada source implementation yang diubah** di seluruh investigasi ini — semua perbaikan murni
di file test.

---

## 7. Regression test baru — desain "SSOT dari manifest, dilarang fallback ke model" (2026-08-24, lanjutan)

Sesuai arahan project vision: **`api-contract.ts` harus berasal dari data asli backend → IR
manifest → `manifestToContractInput` → `api-mapper.ts`, tidak boleh diam-diam fallback ke model.**
Sebelum implementasi source apapun untuk gap collection, ditambahkan dulu regression test yang
mengunci kontrak ini secara eksplisit, supaya begitu implementasi collection dilakukan, ada bukti
test bahwa perilaku "SSOT dari manifest" tetap terjaga — bukan cuma "collection jadi array" tapi juga
"tidak menebak dari model".

File baru: `packages/cli/src/generators/utils/__tests__/register-response-data-shape.regression.test.ts`

Lima kelompok test (`describe`), memakai fixture `register.post -> RegisterResponse` (resource-based,
konsisten dengan `register-response-contract.regression.test.ts` yang sudah ada), plus **resource
decoy `User`** yang field-nya sengaja berbeda dari `RegisterResponse.data.user` (extra field
`password_hash`, tanpa field `name`) — supaya kalau mapper pernah salah fallback ke resource/model
lain by-name, test langsung ketahuan lewat field yang bocor atau field yang hilang.

| # | Nama test | Hasil | Makna |
|---|---|---|---|
| 1 | `data as nested object` — no model fallback | ✅ **pass** | Membuktikan `data.token` & `data.user.{id,name}` berasal dari manifest, bukan dari resource `User` — `password_hash` tidak pernah muncul di hasil maupun kode akhir. Mengunci invariant "no model fallback" secara eksplisit untuk pertama kalinya. |
| 2 | `data as array of objects` | 🔴 **fail (by design)** | `ReadonlyCollectionType` diharapkan, tapi hasil aktual `ReferenceType` — bukti langsung Gap 1 (field `kind:'array'` belum ditangani). |
| 3 | `nested array: data[] -> items[] -> object` | 🔴 **fail (by design)** | Sama seperti #2, membuktikan rekursi array juga belum ada (bukan hanya satu level). |
| 4a | `unknown` tetap jujur sebagai `z.unknown()` | ✅ **pass** | `{kind:'unknown'}` sudah berperilaku benar hari ini: tidak pernah menebak jadi `ObjectType`/`ReadonlyCollectionType`, dan kode akhir tetap `z.unknown()` — tanpa bocor `password_hash`. |
| 4b | `object` tidak pernah terdegradasi ke `z.unknown()` | ✅ **pass** | Field yang bentuknya sudah diketahui penuh tidak pernah muncul sebagai `z.unknown()` di kode akhir. |
| 4c | `array` harus beda representasi dari `unknown` | 🔴 **fail (by design)** | Ini bukti eksplisit bahwa **hari ini `kind:'array'` dan `kind:'unknown'` berakhir di representasi yang SAMA** (`ReferenceType` → `z.unknown()`) — padahal secara semantik keduanya harus dibedakan. Ini penajaman dari Gap 1: bukan cuma "array belum didukung", tapi "array saat ini disamarkan seolah-olah unknown". |
| 5 | E2E: manifest → `manifestToContractInput` → `ContractGeneratorPass` → kode akhir | ✅ **pass** | Untuk response yang sepenuhnya diketahui bentuknya (nested object), kode akhir memuat `RegisterResponse`, `data`, `token`, `user`, `id`, `name`, **tidak mengandung `z.unknown()` sama sekali**, dan tidak bocor `password_hash`. Ini bukti end-to-end pertama yang benar-benar sampai ke output kode, bukan berhenti di `manifestToContractInput`. |

**Hasil run**: 4 pass, 3 fail — persis sesuai desain (3 kegagalan = capability target yang memang
belum diimplementasikan, dikonfirmasi lewat pesan assertion yang jelas menyebut "known limitation").

**Update baseline gabungan** (setelah file baru ini ditambahkan ke suite):
**873 passed, 14 failed, 5 skipped** dari 892 total, 7 file gagal. Kenaikan dari 10-11 → 14 gagal
murni berasal dari 3 test baru yang *sengaja* gagal sebagai capability target (bukan regresi) — tidak
ada satupun test lama yang sebelumnya pass jadi gagal.

**Poin desain penting yang terungkap dari test #4c**: gap collection sebelumnya (bagian 2, "Gap 1")
ternyata punya implikasi lebih tajam dari yang terlihat — karena `kind:'array'` dan `kind:'unknown'`
sama-sama jatuh ke `default:` branch di `mapResourceFieldToNestedType()`, keduanya **tidak bisa
dibedakan sama sekali** hari ini, baik di level `SemanticType` maupun di kode Zod akhir
(`z.unknown()` untuk keduanya). Implementasi `kind:'array'` nantinya harus memastikan kedua kasus ini
berpisah jalur secara eksplisit, bukan cuma menambah satu case baru yang kebetulan mirip.

## File yang sudah diubah (kumulatif)

- `packages/core/src/compiler/passes/__tests__/ContractGeneratorPass.test.ts` — fix syntax fixture
  (lihat bagian 1).
- `packages/core/src/compiler/passes/__tests__/FormGeneratorPass.test.ts` — fix assertion salah
  target (lihat bagian 4).
- `packages/cli/src/generators/utils/__tests__/register-response-data-shape.regression.test.ts` —
  **file baru**, 5 kelompok regression test SSOT/no-model-fallback (lihat bagian 7).

**Tidak ada source implementation** (`manifest-to-types.ts`, `SemanticType.ts`,
`ContractGeneratorPass.ts`, dst.) **yang diubah** di seluruh investigasi ini — seluruh perubahan
murni di file test, sesuai kesepakatan: buktikan gap lewat test dulu, baru implementasi source
setelah kontrak IR final disepakati.

---

## 8. KOREKSI ARSITEKTUR — desain `.fields.data` di bagian 2 & 7 SALAH (2026-08-24, lanjutan diskusi)

**Pertanyaan yang memicu koreksi ini**: manifest adalah hasil scan langsung dari backend Laravel
aktual. Kalau backend beneran balikin array polos di root (`return response()->json([...])`, tanpa
key `data` apapun), apakah desain wrapping ke `responseData.fields.data` (diusulkan di bagian 2, lalu
diuji/dikunci di bagian 7 test #2 dan #3) masih benar?

**Jawaban: TIDAK.** Desain itu salah — ditemukan lewat audit lanjutan, bukan lewat test yang sudah
ditulis (test #2/#3 di bagian 7 memang mem-verifikasi *bahwa* implementasinya belum ada, tapi
fixture-nya sendiri mengasumsikan target output yang keliru).

### Ada dua pipeline paralel untuk response shape, masing-masing punya gap sendiri

**A. `ContractGeneratorPass`** (via `manifest-to-types.ts` → `RequestType.responseData.fields`) —
**pipeline yang SELALU jalan tanpa flag**, menghasilkan `api-contract.ts` (dipanggil dari
`CompilerBridge.generateContractTypes()` di `commands/generate.ts` baris 97). Ini pipeline yang
seluruh analisis bagian 1-7 di atas targetkan.
- Baca `response.fields` dengan benar (nested object, primitive, dst.)
- **Tidak punya konsep "shape" first-class** — `responseData.fields` cuma `Record<string,
  SemanticType>`, objek datar. Tidak ada tempat menyimpan "response ini sebenarnya array".
- **Tapi mekanisme yang benar untuk representasi "response = array polos" SUDAH ADA**, di file yang
  sama persis (`ContractCodeBuilder.ts` baris 248):
  ```ts
  export const ${indexSchema.schemaName} = z.array(${showSchema.schemaName});
  ```
  `XShowSchema` (objek tunggal) dan `XIndexSchema` (`z.array(XShowSchema)`, tanpa wrapper apapun)
  **selalu digenerate berdua**, untuk setiap resource, oleh `processResponseTypes()`
  (`ContractGeneratorPass.ts` baris 264-309) — terlepas dari apakah route yang bersangkutan memang
  collection atau bukan.
- **Gap sebenarnya**: tidak ada kode di layer manapun (`SDKGenerator`, `api-mapper` generation, dkk.)
  yang memilih `XIndexSchema` vs `XShowSchema` untuk route tertentu berdasarkan
  `route.response.collection`. Dikonfirmasi lewat pencarian eksplisit — nol referensi ke
  `IndexSchema`/`ShowSchema` di seluruh `packages/cli/src/generators/*.ts` maupun `layers/*.ts`.
  Kedua schema tergenerate, tapi **tidak pernah dipakai** oleh apapun untuk memvalidasi response
  route yang sesungguhnya.

**B. `ResponseAnalysisPass` / `StructuredResponseIRBuilder`** (via `ResponseIR`, dipakai
`ZodTierGenerator`, **hanya jalan kalau CLI diberi flag `--zod`**) — pipeline "Phase 4C" yang lebih
baru dan lebih canggih secara desain.
- Punya `CollectionShape` sebagai discriminated type first-class: `{kind:'single'} |
  {kind:'collection'} | {kind:'paginated'}` (`ResponseIR.ts` baris 15-18).
- `ResponseAnalysisPass.analyzeRouteResponse()` (baris 81-111) **sudah benar** membaca
  `response.collection === true` dan `response.paginated === true` untuk menentukan `shape`.
- **Tapi untuk `response.kind === 'object'` (dan `'unknown'`), field asli dibuang total** —
  `buildResponseBody()` (baris 186-197) hardcode:
  ```ts
  schema: { name: analysis.routeName, properties: {}, required: [] }
  ```
  `response.fields` tidak pernah dibaca sama sekali di file ini. Jadi pipeline ini tahu "ini
  collection", tapi tidak tahu apa isi tiap elemennya kalau bentuknya inline object (bukan resource
  reference bernama).

### Kesimpulan

**Tidak ada satupun dari kedua pipeline yang benar-benar lengkap** untuk kasus "response inline
object/array yang bentuknya harus diketahui field-per-field DAN shape-nya (single/collection)
sekaligus". Masing-masing sudah memecahkan setengah masalah yang berbeda:
- Pipeline A tahu field-nya, tidak tahu shape-nya (dan tidak mewiring index-schema meski sudah ada).
- Pipeline B tahu shape-nya, tidak tahu field-nya (untuk kind object/unknown).

**Implikasi untuk test bagian 7 — KOREKSI (lihat juga bagian 9)**: analisis awal di bagian ini keliru
menyamakan test #2/#3 (field-level `kind:'array'`) dengan masalah response-level collection. Sudah
diperbaiki — lihat bagian 9 di bawah.

### Opsi arah desain (belum diputuskan, menunggu keputusan)

1. **Perbaiki wiring di Pipeline A** — tambahkan logic di `manifestToContractInput`/consumer-nya
   untuk memilih `XIndexSchema` vs `XShowSchema` per-route berdasarkan `route.response.collection`,
   memanfaatkan mekanisme yang sudah ada (tidak perlu wrapper field baru). Field-level `kind:'array'`
   (field di dalam object, bukan response-level) tetap perlu penanganan terpisah (masih valid, ini
   beda dari response-level collection).
2. **Selesaikan Pipeline B** — isi `properties`/`required` di `buildResponseBody()` dengan field asli
   dari `response.fields` (bukan hardcode kosong), supaya `--zod` tier benar-benar lengkap.
3. **Unifikasi** — jangka panjang, pertimbangkan apakah dua pipeline ini seharusnya konvergen jadi
   satu representasi IR (kemungkinan `ResponseIR` dari Pipeline B, karena desainnya secara semantik
   lebih benar/first-class), supaya `api-contract.ts` (unconditional) dan `--zod` tier tidak punya dua
   sumber kebenaran yang berbeda untuk hal yang sama.

Opsi 1 paling kecil scope-nya dan tidak menyentuh Pipeline B sama sekali — kemungkinan besar paling
aman untuk diimplementasikan lebih dulu tanpa risiko regresi ke `--zod` tier yang terpisah.

---

## 9. KOREKSI ATAS KOREKSI — bagian 8 overcorrect, test #2/#3 di bagian 7 sebenarnya TIDAK salah

Setelah user bertanya "test-nya salah?", diverifikasi ulang: bagian 8 di atas keliru menyamakan dua
gap yang sebenarnya berbeda code path. Ini klarifikasinya:

| | Field-level `kind:'array'` (test #2/#3, `register-response-data-shape.regression.test.ts`) | Response-level `collection:true` (test "capability: inline object collection", `manifest-to-contract.e2e-regression.test.ts`, sudah ada sebelum sesi ini) |
|---|---|---|
| Bentuk manifest | `RegisterResponse.fields = {success, message, data: {kind:'array',...}}` — `data` field yang **dideklarasikan eksplisit**, bersanding field lain | `route.response = {kind:'object', collection:true, fields:{id,name}}` — **seluruh response** adalah array, tidak ada wrapper apapun |
| Apakah field `data` nyata ada di JSON backend? | **Ya** — kalau backend punya envelope `{success, message, data}` (pola umum Laravel), field itu memang ada | **Tidak relevan** — tidak ada konsep "field data" sama sekali di kasus ini, response-nya sendiri = array |
| Code path yang harus menangani | `mapResourceFieldToNestedType()`, `case 'array':` baru (belum ada) | `manifestToContractInput()`, cabang `response.kind==='object' && response.collection` (belum baca `.collection` sama sekali) |
| Target fix yang benar | `ReadonlyCollectionType` untuk field tsb — **tidak berubah**, tetap valid | **Bukan** `.fields.data` (itu yang salah) — harus wiring ke `XIndexSchema` yang sudah ada (lihat bagian 8) |
| Status test terkait | ✅ **valid, tidak perlu diubah** | ⚠️ perlu didesain ulang (test lama, bukan ditulis di sesi ini) |

**Kesimpulan**: `register-response-data-shape.regression.test.ts` test #1, #2, #3, #4a-c, #5 **semuanya
tetap valid seperti sebelumnya** — tidak ada yang perlu diubah. Nama field `data` di fixture saya
kebetulan mengikuti konvensi umum Laravel, tapi itu field asli yang dideklarasikan, bukan wrapper
sintetis yang diciptakan mapper — jadi tidak kena masalah yang sama dengan test lama di bagian 8.

Yang benar-benar perlu didesain ulang **hanya** test "capability: inline object collection is
represented as array of object" (`manifest-to-contract.e2e-regression.test.ts`) dan satu test serupa
di `manifest-to-types.collection-regression.test.ts` — keduanya spesifik soal response-level bare
array, bukan field-level array manapun.

---

## 10. `MapperGeneratorPass` — audit + kontrak + test-first (2026-08-24, sesi baru)

**Konteks**: `packages/cli/src/generators/layers/MapperEmitter.ts` (yang men-generate `api-mapper.ts`)
ternyata bagian dari **pipeline ketiga** yang belum pernah diaudit sebelumnya — `ContractIR`/`IREmitter`,
dipakai command `generate-v2` (terpisah dari `generate` default). Keputusan eksplisit: **tidak
menyentuh** `MapperEmitter.ts`/`ContractIR`/`ResourceIR`/`generate-v2`. Target: pass baru,
`MapperGeneratorPass`, dibangun di `packages/core/src/compiler/passes/` mengikuti pola persis
`ContractGeneratorPass`/`FormGeneratorPass` (pipeline #1, yang sudah diaudit tuntas di bagian 1-9).

### Audit hasil (langkah 1-3)

- `CompilerPass<I,O>` — semua pass yang ada sekarang **single-input single-output**. Belum ada
  preseden multi-input, tapi sistem tipe (`ResolveArtifacts<I extends readonly ArtifactKey[]>`)
  mendukungnya.
- `ArtifactRegistry` (`artifacts/types.ts`) belum punya key `GeneratedMapper` — perlu ditambah.
- `RequestTypesArtifact.responseData.fields: Record<string, SemanticType>` — **key snake_case asli**
  (dari `manifestToContractInput`, beda dengan `manifestToRequestTypes` yang camelCase). Tidak ada
  `transformedName` bawaan untuk field response — harus diturunkan sendiri pakai `toCamelCase()`.
- `RequestTypesArtifact.actions[].fields[]: RequestField` — sudah punya `originalName` **dan**
  `transformedName` sekaligus — langsung dipakai tanpa turunan tambahan.
- `RequestType.formTypeName` — sudah ada di artifact, tidak perlu ditebak.
- `GeneratedContractArtifact` — **tidak** menyimpan field individual (cuma `code` string + metadata)
  → tidak berguna untuk read-mapper, jadi **tidak dipakai sebagai input kedua**.
- Nama tipe `${Resource}ApiResponse` dikonfirmasi persis dari `ContractCodeBuilder.ts:293`.
- Nama tipe `${Resource}Transformed` dikonfirmasi persis dari `TypeScriptGeneratorPass.ts:165/274`
  (digenerate `TypeScriptGeneratorPass`, sumber `api-read.ts` — pipeline yang sama, pass berbeda).
- Konvensi nama fungsi (`to${Resource}Read`, `to${Resource}ReadList`, `toApi${Request}${Action}`)
  diambil dari `MapperEmitter.ts` **lama** — hanya pola penamaannya yang dipakai ulang (didokumentasikan
  proyek sebagai "Engine.Fix.md §18/§21"), bukan kode/dependency `ContractIR`-nya.
- `FormAction.name` bertipe `'create'|'update'` **lowercase**; `FormActionGenerator.ts:63` konfirmasi
  key di dalam form type juga lowercase (`create: {...}`) — jadi akses tipe form pakai
  `${formTypeName}['create']`, bukan `['Create']`.
- Tidak ada enum `ApiApiField` di pipeline #1 (itu spesifik `ContractIR` lama) — form-mapper pakai
  `RequestField.originalName` langsung sebagai key literal.
- Tidak ada artifact `XPayload` type di pipeline #1 (`FormGeneratorPass` cuma generate form type,
  bukan payload type) — form-mapper return type **dibiarkan inferred inline**, bukan mereferensikan
  tipe eksternal yang tidak ada (mengulangi disiplin yang sama dari kasus `.fields.data`).

### Kontrak final

- **Input**: `['RequestTypes']` — single input, cukup (lihat alasan penolakan `GeneratedContractArtifact`
  di atas).
- **Output**: `['GeneratedMapper']` — artifact baru.

| Elemen | Sumber | Formula |
|---|---|---|
| Read mapper | `responseData.fields` | `to${Resource}Read = (api: ${Resource}ApiResponse): ${Resource}Transformed => ({ ${camelKey}: api.${snakeKey}, ... })` |
| Read list mapper | `responseData` | `to${Resource}ReadList = (api: ${Resource}ApiResponse[]): ${Resource}Transformed[] => api.map(to${Resource}Read)` |
| Nested object field | `ObjectType` di dalam `responseData.fields` | tetap object literal bersarang, field-per-field — **tidak** collapse jadi `field: api.field` |
| Form mapper | `actions[]` | `toApi${Resource}${Capitalize(action.name)} = (form: ${formTypeName}['${action.name}']) => ({ ${originalName}: form.${transformedName}, ... })` |
| Route tanpa `responseData` | — | tidak menghasilkan read mapper untuk resource itu |

### File test baru (test-first, sesuai TDD)

`packages/core/src/compiler/passes/__tests__/mapper-generator-pass.test.ts` — 8 test, mencakup:
1. Read mapper + read-list mapper dasar (nama fungsi & tipe tepat)
2. Nested object field tetap bersarang (bukan flatten/degradasi)
3. Route tanpa `responseData` tidak menghasilkan read mapper
4. Form mapper dasar — field literal `originalName`, bukan enum `ApiApiField`
5. Multi-action (`create`+`update`) pada resource yang sama, masing-masing dapat fungsi sendiri
6. Empty `requestTypes` → artifact kosong valid, `typeId: 'GeneratedMapper'`
7. Deterministik — run dua kali, hasil `code` identik

**Hasil run**: `Cannot find module '../MapperGeneratorPass'` — **gagal sesuai desain TDD**
(module belum diimplementasikan). Ini kontrak yang jelas untuk langkah implementasi berikutnya.

**Belum diimplementasikan**: `MapperGeneratorPass.ts` itu sendiri, dan penambahan key `GeneratedMapper`
ke `ArtifactRegistry`. Menunggu keputusan lanjut untuk mulai implementasi.

---

## 11. `ApiApiField` — koreksi kontrak MapperGeneratorPass (2026-08-24, lanjutan bagian 10)

User menunjukkan file `api-field.ts` nyata dari proyek. Sebelum menerima begitu saja, diverifikasi
dulu **dari pipeline mana** file ini digenerate — hasilnya bukan dari pipeline #1 sama sekali:

```
grep -rln "ApiApiField" packages → hanya:
  packages/cli/src/generators/layers/FieldEmitter.ts   (generator asli)
  packages/cli/src/generators/layers/MapperEmitter.ts  (pemakai, pipeline IR/generate-v2)
  packages/cli/src/generators/ZodTierGenerator.ts       (pemakai, pipeline --zod)
```

**Bukan bagian pipeline #1** — jadi `MapperGeneratorPass` harus **generate sendiri** const
`ApiApiField`-nya sebagai bagian dari `GeneratedMapperArtifact`, bukan mengimpor dari pipeline lain
(yang eksplisit tidak boleh disentuh).

### Temuan bonus: bug di `FieldEmitter.ts` (pipeline lama, TIDAK diperbaiki — di luar scope)

`FieldEmitter.camelCaseToSnakeUpper()`:
```ts
private camelCaseToSnakeUpper(camelCase: string): string {
    return camelCase.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase()
}
```
Diverifikasi empiris (`node -e`): `camelCaseToSnakeUpper('redirectTo')` → `'REDIRECT_TO'` (dengan
underscore) — **tidak cocok** dengan docstring method itu sendiri (`redirectTo → REDIRECTTO`, tanpa
underscore) **maupun** dengan file `api-field.ts` nyata yang ditunjukkan user (`REDIRECTTO: "redirect_to"`,
tanpa underscore). Ini bug nyata di kode pipeline lama — dicatat sebagai temuan, **tidak diperbaiki**
karena eksplisit di luar scope (`ContractIR`/`FieldEmitter` tidak disentuh).

Algoritma yang **benar-benar cocok** dengan output nyata (diverifikasi empiris terhadap 5 contoh dari
file asli: `name`, `redirect_to`, `provider_user_id`, `shipping_kode_pos`, `is_verified_purchase`):
```ts
originalName.toUpperCase().replace(/_/g, '')
```
Diturunkan langsung dari `RequestField.originalName` (snake_case asli) — **bukan** dari
`transformedName` (camelCase) seperti pendekatan buggy `FieldEmitter.ts`. Ini kebetulan lebih
sederhana dan langsung kompatibel dengan data yang sudah ada di `RequestTypesArtifact` pipeline #1.

### Update kontrak `MapperGeneratorPass`

| Elemen | Formula |
|---|---|
| `ApiApiField` const | Dikumpulkan **global, dedup** dari `originalName` semua `RequestField` di semua `actions[]` semua `RequestType` — satu entry per `originalName` unik, walau dipakai di banyak resource/action berbeda |
| Key const | `originalName.toUpperCase().replace(/_/g, '')` |
| Form mapper field mapping | `[ApiApiField.${KEY}]: form.${transformedName}` — bracket notation, **bukan** literal key langsung (koreksi dari bagian 10 yang sebelumnya bilang "tanpa enum") |

### Update test file

`mapper-generator-pass.test.ts` — dari 8 jadi **10 test**. Perubahan:
- Test form-mapper direvisi: dari assert literal key (`name: form.name`) jadi assert bracket notation
  (`[ApiApiField.NAME]: form.name`), dan assertion `not.toContain('ApiApiField')` yang lama **dihapus**
  (sudah tidak valid, kontraknya berubah).
- 2 test baru: dedup lintas resource/action (field sama, muncul di resource berbeda → hanya 1 entry
  const), dan verifikasi persis algoritma penamaan key terhadap 2 contoh dari file nyata
  (`provider_user_id`→`PROVIDERUSERID`, `shipping_kode_pos`→`SHIPPINGKODEPOS`), sekaligus assert
  **tidak** menghasilkan versi dengan underscore (bukti eksplisit tidak mengulang bug `FieldEmitter.ts`).

**Hasil run**: masih gagal `Cannot find module '../MapperGeneratorPass'` — konsisten, bukan bug
fixture baru. Total sekarang 10 test menunggu implementasi.

---

## 12. Split output jadi 2 file — koreksi kontrak `GeneratedMapperArtifact` (2026-08-24, lanjutan bagian 11)

User klarifikasi: 2 file itu ada di **folder berbeda**, bukan berdua di `mappers/`:
- `contract/api-field.ts` — const `ApiApiField` (path ini **persis sama** dengan yang dipakai
  `FieldEmitter.ts` lama: `path: 'contract/api-field.ts'` — hanya STRING PATH-nya yang dipakai ulang
  sebagai konvensi penamaan, bukan kode/dependency file itu)
- `mappers/api-mapper.ts` — fungsi mapper (`toXRead`, `toXReadList`, `toApiXCreate`, `toApiXUpdate`)

### Update kontrak `GeneratedMapperArtifact`

Artifact sekarang punya **2 field kode terpisah**, bukan 1 `.code` gabungan:
```
GeneratedMapperArtifact {
    code: string            // → mappers/api-mapper.ts (fungsi mapper)
    fieldTableCode: string  // → contract/api-field.ts (const ApiApiField)
}
```
Fungsi mapper di `.code` mereferensikan `ApiApiField.<KEY>` sebagai identifier bebas (asumsi
di-import dari `contract/api-field.ts` oleh CLI-layer saat file benar-benar ditulis) — pass ini
**tidak** menentukan statement import/penulisan file, konsisten dengan `ContractGeneratorPass`/
`FormGeneratorPass` yang juga cuma hasilkan `.code`, penulisan file jadi tanggung jawab
`CompilerBridge`/`commands/generate.ts`.

### Update test file

`mapper-generator-pass.test.ts` — dari 10 jadi **11 test**:
- 3 assertion `ApiApiField` yang sebelumnya cek `result.code` dipindah ke `result.fieldTableCode`
- Test baru: **regresi anti-duplikasi** — `.code` boleh referensi `ApiApiField.EMAIL` sebagai
  identifier, tapi **tidak boleh** mengandung definisi tabel (`export const ApiApiField = {`);
  sebaliknya `.fieldTableCode` **tidak boleh** mengandung fungsi mapper (`toApiRegisterCreate`).
  Ini mengunci agar kedua output benar-benar terpisah, bukan tercampur/terduplikasi.
- Test empty-artifact & deterministic diperluas untuk verifikasi **kedua** field kode (`code` dan
  `fieldTableCode`), bukan cuma satu.

**Hasil run**: masih gagal `Cannot find module '../MapperGeneratorPass'` — konsisten. Total sekarang
11 test menunggu implementasi.
