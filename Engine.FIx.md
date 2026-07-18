# RouteSync — Deep Architecture Review: Frontend Generator Pipeline

> Semua temuan berdasarkan pembacaan langsung source code (`packages/cli/src/generators/*.ts`), bukan asumsi dari nama file.

---

## 0. Jawaban Cepat: Siapa yang Generate Apa

Enam file yang dipertanyakan — `api-contract.ts`, `api-schema.ts`, `api-field.ts`, `api-read.ts`, `api-form.ts`, `api-mapper.ts` — semuanya ditulis oleh **satu class yang sama**: `ZodTierGenerator.ts` (1890 baris, 83KB — file generator terbesar di seluruh repo, ~4x lebih besar dari generator kedua terbesar, `HookGenerator.ts` 20KB).

```
ZodTierGenerator.ts
  ├─ generate()          → orchestrator, dipanggil dari sync.ts
  ├─ generateContract()  → contract/api-contract.ts   (baris 112-420)
  ├─ generateSchema()    → contract/api-schema.ts      (baris 666-765)
  ├─ generateField()     → contract/api-field.ts       (baris 770-813)
  ├─ generateRead()      → types/api-read.ts           (baris 867-1071)
  ├─ generateForm()      → types/api-form.ts           (baris 1080-1127)
  └─ generateMapper()    → mappers/api-mapper.ts       (baris 1180-1525)
```

Sisanya (generator independen, file terpisah):

| Output | Generator |
|---|---|
| `hooks.ts` | `HookGenerator.ts` (20KB) |
| `api.ts` | `SDKGenerator.ts` (10KB) |
| `query-key.ts` | `QueryKeyGenerator.ts` (4KB) |
| `constants.ts` | `ConstantsGenerator.ts` (9KB) |
| `types/index.ts` | `TypeGenerator.ts` (type declaration murni, tanpa runtime schema) |

**Jadi bukan cuma "coupling antar layer"** — enam dari sepuluh output file lahir dari satu class 1890 baris. Ini **God Object** klasik: satu unit compile-time state (`knownSchemas`, `graph`, `routeResponseMap`) di-share implisit lintas enam tanggung jawab berbeda (contract/schema/field/read/form/mapper) lewat method call chaining di dalam satu class statis — bukan lewat IR eksplisit dan immutable antar tahap.

### Soal PHP Script

Ya, ada, dan **wajib** untuk flag `--models`:

- `LaravelRouteParser.ts` membangun string PHP (`phpScript`, mulai baris 103) sebagai template literal berisi kode Laravel bootstrap penuh, ditulis ke `routesync-dump.php` di root project Laravel, lalu dieksekusi via `spawnSync` (child process, bukan `execSync` — sengaja diganti agar bisa capture stdout+stderr terpisah).
- Script ini butuh `vendor/autoload.php` (bootstrap Laravel penuh) — **bukan** static analysis PHP murni. Terbukti langsung saat re-run di sandbox: gagal total karena tidak ada `vendor/`, dan `composer install` tidak bisa dijalankan karena `packagist.org` di luar network whitelist sandbox.

**Implikasi:** boundary antara "PHP Scanner" dan "Frontend Generator" **bukan** clean static-analysis-only seperti judul section "PHP Scanner Review" mengasumsikan — ini reflection-based scanning yang mensyaratkan aplikasi Laravel bisa di-boot (autoload + kemungkinan koneksi DB kalau `--models` aktif, karena `ManifestGenerator`/`extractModels` butuh introspeksi kolom tabel).

---

## 1. Ringkasan Arsitektur Saat Ini

Pipeline nyata (bukan yang diasumsikan dokumen awal):

```
routesync.manifest.json
        │
        ▼
normalizeManifest()  (normalizer.ts + passes.ts, CompilerPipeline 4-pass)
        │
        ▼
   ┌────┴─────────────────────────────────────────────────────┐
   │                                                            │
   ▼                                                            ▼
ZodTierGenerator.generate()                      TypeGenerator / HookGenerator /
   │  (1 class, 1890 baris, 83KB)                 SDKGenerator / QueryKeyGenerator /
   │                                               ConstantsGenerator / IndexGenerator
   ├─ generateContract() → contract/api-contract.ts
   ├─ generateSchema()   → contract/api-schema.ts
   ├─ generateField()    → contract/api-field.ts
   ├─ generateRead()     → types/api-read.ts
   ├─ generateForm()     → types/api-form.ts
   └─ generateMapper()   → mappers/api-mapper.ts
```

**Temuan #1 (paling penting):** dokumen awal membingkai 6 file itu (contract/schema/field/read/form/mapper) seolah 6 layer arsitektur berbeda. Kenyataannya, keenamnya adalah **6 method dari 1 class yang sama** — `ZodTierGenerator`. Tidak ada isolasi module, tidak ada boundary compile-time antar "layer" — semuanya numpang di `private static knownSchemas`, `private static graph` (sekarang dead field, sudah di-fix), dan sebuah `Map<string, RouteResponseComposition>` yang di-pass manual dari `generateContract()` ke `generateRead()`/`generateMapper()` sebagai parameter biasa.

---

## 2. Dependency Graph (Real, dari Import Statement)

```
@routesync/core (RouteManifest, ContractGraph, SemanticResolutionKernel)
        │
        ▼
   normalizer.ts ── pipeline.ts (CompilerPipeline: ModelGraphBuilderPass →
        │            SemanticResolutionPass → NormalizationPass → ValidationPass)
        ▼
   ZodTierGenerator.ts ──┬── names.ts (toTypeName, camelCase, buildGeneratedRoutes)
        │                └── route-classifier.ts (deriveGroupName)
        │
        ├──▶ contract/api-contract.ts
        ├──▶ contract/api-schema.ts
        ├──▶ contract/api-field.ts
        ├──▶ types/api-read.ts
        ├──▶ types/api-form.ts
        └──▶ mappers/api-mapper.ts

   TypeGenerator.ts     ──▶ types/index.ts, api-read.ts (barrel re-export saja, TANPA baca ZodTierGenerator)
   HookGenerator.ts     ──▶ hooks.ts     (independen, re-derive naming sendiri lewat route-classifier.ts)
   SDKGenerator.ts      ──▶ api.ts       (independen, re-derive naming sendiri via getResponseInfo() lokal)
        │                                 └── import { ConstantsGenerator } (satu-satunya cross-generator import nyata di repo)
   QueryKeyGenerator.ts ──▶ query-key.ts (independen)
   ConstantsGenerator.ts──▶ constants.ts (independen)
   IndexGenerator.ts    ──▶ index.ts     (barrel re-export semua file di atas)
```

**Yang janggal:** `SDKGenerator.ts` dan `HookGenerator.ts` tidak pernah mengimpor apa pun dari `ZodTierGenerator.ts` — padahal `api.ts` (dibuat SDKGenerator) harus tahu nama exact `validate${KeyName}Response` yang dideklarasikan oleh `ZodTierGenerator.generateContract()`, dan `hooks.ts` harus tahu nama mapper yang dideklarasikan oleh `ZodTierGenerator.generateMapper()`.

Tidak ada shared IR atau lookup table di antara mereka. Yang ada: setiap generator menebak ulang nama itu sendiri, secara independen, dari input mentah yang sama (`route.response`). Ini bukan dependency graph yang sehat — ini **implicit contract by convention**, tidak dijamin compiler.

---

## 3. Redundancy Review — Bukti Konkret

| Logic yang diduplikasi | Lokasi | Jumlah kemunculan |
|---|---|---|
| CRUD action map `{post:'Create', put:'Update', patch:'Update', delete:'Delete'}` | `ZodTierGenerator.ts` (4x: `CONTRACT_ACTION_MAP`, `SCHEMA_ACTION_MAP` x2, `MAPPER_ACTION_MAP`) + `SDKGenerator.ts` (1x: `SDK_ACTION_MAP`) + `HookGenerator.ts` (1x: `ACTION_TO_CRUD_HOOK`) | **6 tempat**, 6 nama variabel beda, isi identik |
| `TitleCaseResource = toTypeName(...)`, `KeyName = TitleCaseResource + rawAction` | Tersebar di `generateContract`, `generateSchema` (2x), `generateForm`, `generateMapper` (4x) | ~9 kali di dalam satu file yang sama |
| "Apakah response ini model/resource, ambil nama base-nya" (`resolvedKind = meta.kind \|\| meta.type`) | `ZodTierGenerator.generateContract()` (versi `isResourceAlias`/`resourceRef`) + `ZodTierGenerator.generateMapper()` (versi `baseModel`/`kind`) + `SDKGenerator.getResponseInfo()` (versi ketiga) + `HookGenerator.ts` (2 versi berbeda di file yang sama: `resolveBaseResponseName()` baris 15-40, `resolveResponseInfo()` baris 68+) | **6 implementasi independen**, di 3 file berbeda, 2 di antaranya di file yang sama |

**Root cause dari yang terakhir (paling parah):** keputusan "route ini alias ke Resource yang sudah ada, atau butuh nama fallback baru" dihitung ulang dari nol di setiap generator, bukan dibaca dari satu sumber kebenaran. `ZodTierGenerator.generateContract()` sebenarnya **sudah** menghitung ini dengan benar dan menyimpannya di `routeResponseMap` (`RouteResponseComposition` — persis IR yang dibutuhkan!) — tapi struktur ini private ke `ZodTierGenerator`, tidak pernah diekspor, tidak pernah dibaca `SDKGenerator`/`HookGenerator`. Mereka menebak ulang dengan heuristik sendiri-sendiri.

**Dampak nyata:** kalau naming/aliasing logic di `ZodTierGenerator` berubah, `SDKGenerator.getResponseInfo()` dan 2 versi di `HookGenerator.ts` tidak akan otomatis ikut berubah — harus di-update manual, 4-5 tempat, tanpa ada compiler check yang memaksa konsistensi. Ini persis kelas bug yang sudah diperbaiki (`OrdersGetResponseSchema = OrderResourceSchema`), hanya saja polanya sekarang terverifikasi ada di 3 file, bukan 1.

### Duplikasi tambahan: `camelCase()` pada kolom

`generateRead()` (baris 867+) independen memanggil `camelCase(col.name)` per model column untuk bikin property TypeScript di `${Model}Transformed`. Transformasi ini sama persis dengan yang sudah dihitung `generateField()` dan disimpan di `fieldMap` — tapi `generateRead()` tidak pernah membaca `ApiField` yang dihasilkan `generateField()`; dia hitung ulang `camelCase()` dari nol. **Total pemanggilan `camelCase()` mentah di seluruh file: 22 kali.**

### Duplicate traversal manifest

Full-manifest traversal `for route of routes` yang menghitung count per-resource diulang **2x identik**: `contractResponseCount` (`generateContract`, baris 294-298) dan `mapperAllRespCount` (`generateMapper`, baris 1206-1213) — kondisi IF, key derivation, dan increment logic-nya sama persis. Ini bukti konkret duplicate traversal — harus jadi 1 IR yang dihitung sekali, bukan 2x.

### `buildResponseZodType()` dipanggil dari 2 method berbeda

`buildResponseZodType()` (baris 512) dipanggil dari: `generateContract()` (baris 335, sekali per route), 2x rekursif dari dirinya sendiri untuk nested field (baris 534, 540), plus 1x lagi dari `generateSchema()` konteks resource (baris 276) dan accessor (baris 144) — total dipanggil di **2 method berbeda** (`generateContract` + `generateSchema`), bukan cuma sekali.

---

## 4. Responsibility Matrix

| Generator | Input | Output | Baca dari generator lain? | Masalah SRP |
|---|---|---|---|---|
| `ZodTierGenerator` | `RouteManifest` | 6 file (contract/schema/field/read/form/mapper) | Tidak (self-contained) | **Parah** — 6 tanggung jawab dalam 1 class 1890 baris |
| `TypeGenerator` | `RouteManifest` (diabaikan, param `_manifest`) | `types/index.ts` | Tidak | Kecil — cuma type declaration, tapi nama filenya overlap dengan output ZodTierGenerator (`api-read`/`api-form`), misleading |
| `HookGenerator` | `RouteManifest` | `hooks.ts` | Tidak, tapi re-derive logic yang seharusnya milik ZodTierGenerator | Duplikasi resolusi resource/model 2x di file sendiri |
| `SDKGenerator` | `RouteManifest` + options | `api.ts` | `ConstantsGenerator` (satu-satunya cross-import valid) | Re-implementasi `getResponseInfo()` independen dari ZodTierGenerator |
| `QueryKeyGenerator` | `RouteManifest` | `query-key.ts` | Tidak | OK, scope sempit |
| `ConstantsGenerator` | `RouteManifest` | `constants.ts` | — (di-import balik oleh SDKGenerator) | 2 algoritma route-key berbeda di file sama |
| `IndexGenerator` | `RouteManifest` + options | barrel `index.ts` | Tahu nama semua file di atas (hardcoded) | Kecil, tapi fragile kalau ada file baru |

---

## 5. Kelemahan Berdasarkan Prioritas

- **[KRITIS]** `ZodTierGenerator` God Object — 1890 baris, 6 tanggung jawab, ~9x duplikasi naming derivation internal.
- **[KRITIS]** Resource-alias/naming decision tidak punya single source of truth — dihitung ulang independen di ≥3 file, 6 tempat. `RouteResponseComposition`/`routeResponseMap` yang sudah ada seharusnya jadi IR bersama, bukan private state.
- **[TINGGI]** `CONTRACT_ACTION_MAP` / `SCHEMA_ACTION_MAP` / `MAPPER_ACTION_MAP` / `SDK_ACTION_MAP` / `ACTION_TO_CRUD_HOOK` — 6 literal identik, harus disatukan jadi 1 konstanta di `names.ts`.
- **[SEDANG]** `api-field.ts` bukan bagian dari Schema layer sama sekali. Isinya cuma lookup table `camelCase → snake_case`:

  ```ts
  export const ApiApiField = {
    USER_NAME: "user_name",
    ...
  } as const
  ```

  Sumbernya dua: (1) key validasi dari `route.schema.rules`, (2) nama kolom model. Fungsinya cuma housekeeping penamaan — sudah dikonfirmasi **orphan output**, tidak ada consumer sama sekali (`generateRead()` tidak pernah membaca hasil `generateField()`, malah hitung ulang sendiri).
- **[SEDANG]** ~~`TypeGenerator.ts` menulis ke `api-read.ts`/`api-form.ts`~~ — **REVISI: false alarm.** Sudah dibaca isi filenya utuh (cuma 50 baris): `TypeGenerator.ts` tidak pernah menulis ke `api-read.ts`/`api-form.ts`, hanya menulis `types/index.ts` berisi 3 interface hardcoded murni (`ApiResponse<T>`, `PaginationMeta`, `PaginatedResponse<T>`, `ApiError`) plus 2 baris barrel re-export (`export * from './api-read'`, `export * from './api-form'`). Grep sebelumnya salah match string di dalam path re-export, bukan di `writeFile()`. Tidak ada race/overwrite.
- **[RENDAH]** PHP Scanner butuh Laravel bootstrap penuh (`vendor/autoload.php`), bukan static analysis murni — legitimate constraint (reflection butuh class yang bisa di-load), tapi berarti "PHP Scanner" sebagai boundary compiler tidak bisa dijalankan tanpa environment Laravel yang utuh.

---

## 6. Compilation vs Rendering — Temuan Paling Penting

**Jawaban langsung:** `generateRead()` **masih melakukan inferensi**, bukan cuma render. Buktinya, ada dua sistem tipe paralel yang identik strukturnya, ditulis dua kali:

```ts
// Baris 835-864 — dipakai generateContract() untuk Zod
private static mapSqlTypeToZod(sqlType: string): string {
  if (type.includes('bool')...) return 'z.boolean()'
  if (type.includes('int')...) return 'z.number()'
  if (type.includes('json')) return 'z.record(z.string(), z.unknown())'
  ...
}
private static mapCastToZod(castType, defaultType) { ... }

// Baris 1148-1180 — dipakai generateRead() untuk TS type, KONDISI SAMA PERSIS
private static mapSqlTypeToTs(sqlType: string): string {
  if (type.includes('bool')...) return 'boolean'
  if (type.includes('int')...) return 'number'
  if (type.includes('json')) return 'Record<string, unknown>'
  ...
}
private static mapCastToTs(castType, defaultType) { ... }
```

Plus `mapResolvedToTsType()` (baris 1633+) yang mem-paralel `buildResponseZodType()` (baris 512+) — keduanya menerima meta/accessor mentah dari manifest dan melakukan resolusi tipe dari nol, bukan membaca satu "canonical resolved type" yang sudah jadi.

**Konfirmasi 100%:** dua sistem tipe paralel ini identik strukturnya, cuma beda output syntax.

**Kesimpulan:** boundary generator ini salah. Inferensi (kolom SQL → tipe apa, cast Laravel → tipe apa, field nullable atau tidak) seharusnya selesai **sekali** di compiler pass (`normalizer.ts`/`pipeline.ts`), menghasilkan satu representasi tipe kanonik (misal `{ kind: 'number', nullable: true }`), lalu kedua emitter (`generateContract` dan `generateRead`) tinggal me-render representasi itu ke syntax masing-masing (`z.number().nullable()` vs `number | null`).

Sekarang, dua inferensi independen ini bisa diam-diam divergen — kalau ada SQL type baru yang di-handle di `mapSqlTypeToZod` tapi lupa ditambah ke `mapSqlTypeToTs`, Zod schema dan TS type akan berbeda untuk field yang sama, dan TypeScript **tidak akan pernah mendeteksinya** karena keduanya independent string-builder, bukan derivasi dari 1 sumber type-checked.

---

## 7. Generator Dependency Graph Berbasis IR (Bukan File→File)

Kenyataan di kode (bukan yang seharusnya): cuma ada 1 IR nyata, dan cuma dipakai internal.

```
RouteManifest (mentah)
        │
        ▼
   generateContract()  ◄── baca knownSchemas (implicit global state, lihat §8)
        │
        ▼
   routeResponseMap: Map<string, RouteResponseComposition>   ← SATU-SATUNYA IR YANG ADA
        │
        ├──────────────┐
        ▼              ▼
   generateRead()   generateMapper()
   (dapat routeResponseMap SEBAGAI PARAMETER — pola benar)
        │
        ▼
   (BERHENTI DI SINI — routeResponseMap TIDAK PERNAH keluar dari ZodTierGenerator)

   SDKGenerator / HookGenerator  ◄── baca RouteManifest MENTAH lagi, re-infer sendiri
                                      (tidak pernah terima routeResponseMap)
```

Jadi grafik IR yang sebenarnya cuma setengah jalan: `ContractIR` (`routeResponseMap`) diteruskan dengan benar ke `ReadModelIR`/`MapperIR` konsumen di dalam kelas yang sama — tapi berhenti di situ, tidak pernah mengalir ke `SDKGenerator`/`HookGenerator`. Bukan "tidak ada IR sama sekali" — IR-nya **ada** tapi terpagar tembok di 1 class, bukan compiler-wide.

---

## 8. Implicit State Audit

| State | Scope | Diisi oleh | Dibaca oleh | Bisa jadi immutable IR? | Temporal coupling? |
|---|---|---|---|---|---|
| `knownSchemas: Set<string>` | `private static` di class (bertahan lintas pemanggilan kalau class di-reuse) | `generate()` baris 56-62, `.clear()` dulu baru diisi ulang | `generateContract()` (7 titik: baris 155,159,571,575,579,629,636) | Ya — harusnya jadi field di IR (`knownSchemaNames: string[]`), bukan static mutable | **Ya, nyata.** Kalau `generateContract()` dipanggil langsung tanpa lewat `generate()` dulu (mis. dari test), `knownSchemas` bisa berisi sisa run manifest sebelumnya kalau `.clear()` lupa dipanggil — silent wrong output, bukan crash |
| `routeResponseMap: Map<string, RouteResponseComposition>` | Lokal ke `generate()`, dibuat di `generateContract()`, di-pass eksplisit sebagai parameter | `generateContract()` | `generateRead()`, `generateMapper()` (parameter, bukan global — **pola benar**) | Sudah — ini persis IR yang dibutuhkan, cuma scope-nya kurang luas (§7) | Tidak — passing eksplisit, aman |
| `contractResponseCount` vs `mapperAllRespCount`/`mapperGetOnlyCount` | Lokal per-function, **tapi isinya dihitung ulang dari nol**, traversal manifest yang sama | Masing-masing function, independen | Masing-masing function sendiri | Ya, harus disatukan — bukti langsung duplicate traversal (§3) | Tidak temporal-coupled (self-contained), tapi redundant computation |
| `generatedRespSchemas: Set<string>` | Muncul 3x dengan nama sama, scope beda: `generateContract()` baris 307 (dedup nama response schema), `generateSchema()` baris 681 (dedup nama payload — tujuan **beda**, kebetulan nama sama), `generateMapper()` (punya `generatedMapperFns`, fungsi serupa nama beda) | Masing-masing function | Masing-masing function sendiri | Sebagian — yang di `generateContract` seharusnya jadi bagian `RouteResponseComposition` | Tidak, tapi confusing karena nama identik untuk tujuan berbeda |

**Kesimpulan:** `knownSchemas` adalah satu-satunya state yang benar-benar berbahaya (class-level static, bukan cuma per-run local) — ini akar structural dari kenapa `ZodTierGenerator` terasa seperti God Object: dia bukan cuma kumpulan method, dia punya shared mutable field yang harus di-reset manual di awal tiap run.

---

## 9. Canonical vs Derived vs Cache vs Projection

```
ResourceSchema + ResourceResponse (Zod + type)         ← DERIVED (1x, benar)
   ↓
Response (per-route, alias ATAU fallback)              ← DERIVED, tapi diputuskan 6x independen (§3)
   ↓
Read Model (${Model}Transformed, camelCase)             ← DERIVED, tapi INFERENSI TIPE-nya ULANG DARI NOL (§6)
   ↓
Form Model                                              ← DERIVED (projection dari schema payload)
   ↓
Mapper (fungsi transform runtime)                       ← DERIVED, tapi baca `routeResponseMap` (BENAR, tidak infer ulang)
```

- `knownSchemas` bukan canonical maupun derived — dia **cache** (nama schema yang sudah "dijanjikan" ada), tapi cache ini di-scope salah (class-static, bukan per-run).
- `api-field.ts` (`ApiField` lookup table) — orphan, bukan canonical/derived/cache/projection apa pun yang genuinely dipakai — **dead output**.

---

## 10. Manifest Audit — Apa yang Kurang

Berdasarkan `ResponseMetadata`/`ParsedRoute` yang sudah diperiksa (`route.ts`):

| Metadata | Sudah ada di manifest? | Catatan |
|---|---|---|
| Canonical resource id | **Tidak** — resource cuma diidentifikasi by-name (`meta.resource: string`), bukan ID stabil. Kalau nama Resource di-rename di Laravel, seluruh downstream naming ikut berubah, tidak ada level of indirection. | |
| Collection metadata | Ada (`collection?: boolean`) | Tapi dihitung ulang beberapa kali secara independen di masing-masing generator (bukan disimpan sebagai keputusan final) |
| Pagination metadata | Ada (`paginated?: boolean`) | Sama — ada tapi bukan hasil keputusan final tunggal |
| Wrapper metadata | Ada (`wrapped?: boolean` — baru ditambahkan sesi fix kemarin) | Sebelumnya GAP di type declaration walau dipakai runtime |
| Mapper metadata | **Tidak ada** di manifest | Sepenuhnya diturunkan ulang di `generateMapper()`/`HookGenerator`/`SDKGenerator` masing-masing |
| Read model metadata | **Tidak ada** | camelCase transform + tipe TS dihitung ulang di `generateRead()` dari raw SQL type, bukan dibaca dari hasil normalisasi |
| Normalization result | Sebagian | `normalizer.ts` MENGHASILKAN `NormalizedManifest`, tapi `ZodTierGenerator.generate()` menerima `RouteManifest` mentah, bukan `NormalizedManifest` (perlu diverifikasi ulang di `sync.ts` — kalau benar, hasil `normalize()` tidak pernah benar-benar dipakai generator) |

**Poin paling penting:** manifest sekarang cukup kaya untuk menyimpan **fakta** (`wrapped`, `collection`, `paginated`) tapi tidak menyimpan **keputusan** (resource-alias-atau-fallback, apa nama TS type-nya, apakah field ini butuh transform). Fakta vs keputusan itu beda — generator masih harus mengubah fakta jadi keputusan sendiri-sendiri, 6 kali.

---

## 11. PHP Scanner vs Frontend Generator — Tabel Per-Tahap

| Tahap | PHP Scanner | Frontend Generator | Catatan |
|---|---|---|---|
| Parse route Laravel (`Route::get(...)`) | ✅ | ❌ | Butuh reflection, sudah benar |
| Resolve Resource (`new OrderResource($x)` → nama resource) | ✅ | ❌ | Sudah benar, ini `LaravelRouteParser.ts` |
| Infer response shape dasar (model/resource/object/collection/paginated/wrapped) | ✅ | ❌ | Sudah benar — fakta-fakta ini genuinely butuh reflection |
| Keputusan: route ini alias ke Resource yang mana, atau butuh nama fallback apa | ❌ | ❌ *(seharusnya ada di sini, sebagai pass tersendiri)* | **Ini yang hilang** — bukan tugas PHP (tidak butuh reflection), tapi juga jangan diserahkan ke tiap generator |
| Resolve tipe TS/Zod dari SQL column type + cast | ❌ | ❌ *(dobel, di 2 tempat berbeda, §6)* | Harusnya 1x di compiler pass, bukan di generator |
| Normalize manifest jadi IR final | ✅ (`normalizer.ts` ada) | — | Tapi hasilnya belum tentu dikonsumsi `ZodTierGenerator` (perlu verifikasi `sync.ts`) |
| Generate TS/Zod syntax (render) | ❌ | ✅ | Ini satu-satunya yang seharusnya ada di Frontend Generator |
| Emit hooks/query-key/constants | ❌ | ✅ | Benar |

---

## 12. Scalability Review (500 model / 2000 route / 10rb type)

**Dasar analisis:** `ContractGraph.ts` (dipakai untuk build dependency graph resource↔model) murni single-pass per collection (`for model of manifest.models`, `for res of manifest.resources`, `for route of manifest.routes` — tidak nested O(n²)), dan `knownSchemas` pakai `Set<string>` (O(1) lookup, bukan array `.includes()`). Secara algoritmik per-generator, ini **linear**, bukan quadratic — kabar baik.

Tapi implikasi dari temuan §1-§11 di scalability bukan soal Big-O, melainkan **constant-factor multiplier** dan **maintenance cost**:

1. Setiap route diproses independen oleh 6 generator berbeda (ZodTierGenerator x6 method, HookGenerator, SDKGenerator, dst), dan ≥6 dari mereka menghitung ulang string derivation yang sama (`toTypeName`, `camelCase`, ACTION_MAP lookup) tanpa cache/memoization lintas generator. Di 2000 route, ini bukan bottleneck performa compile time (string ops itu murah), tapi bottleneck **korektnes**: 2000 route × 6 tempat re-derivation = permukaan yang jauh lebih besar untuk 6 implementasi itu diam-diam divergen (persis root cause bug alias schema yang sudah pernah diperbaiki).
2. **Incremental compilation tidak mungkin** dengan arsitektur sekarang: `ZodTierGenerator.generate()` selalu regenerasi 6 file penuh dari nol (`this.knownSchemas.clear()` di awal `generate()`, baris 56) — tidak ada per-route/per-resource diffing. Di 500 model + 2000 route, tiap perubahan satu route men-trigger full regenerate 6 file (+ 4 file generator lain = total 10 file penuh ditulis ulang). Tidak ada mekanisme cache berbasis `stableHash` (yang sebenarnya sudah ada di `ParsedRoute.stableHash` — tapi dari investigasi ini tampaknya tidak dipakai untuk skip regenerasi, perlu verifikasi lanjut).
3. **Memory:** `knownSchemas` (Set of string) dan `routeResponseMap` (Map) proporsional linear ke jumlah model+resource+route — tidak ada yang O(n²) di memory juga, aman untuk 10rb type.

**Kesimpulan scalability:** arsitektur ini akan tetap compile dengan benar di skala 500 model/2000 route (tidak ada infinite loop atau quadratic blowup yang ditemukan), tapi compile time akan linear-scale dengan konstanta besar karena kerja yang sama (naming derivation) dilakukan berkali-kali lipat per route tanpa sharing hasil, dan zero incremental compilation berarti setiap `routesync sync` di project besar selalu full-rebuild. Ini yang paling perlu diperhatikan kalau target project beneran punya skala segitu — bukan risiko crash/OOM.

---

## 13. Tabel Ringkasan Per-Generator

| Generator | Input | Output | Hidden State | Masalah | Harus Dipindah Ke |
|---|---|---|---|---|---|
| `generateContract` | RouteManifest mentah | `api-contract.ts` | `knownSchemas` (class-static!), `contractResponseCount`, `generatedRespSchemas` | Inference (resource-alias decision + SQL→Zod type) bercampur dengan emit | Scanner (fakta) + IR pass baru (keputusan alias) |
| `generateSchema` | RouteManifest | `api-schema.ts` | `SCHEMA_ACTION_MAP`, `generatedRespSchemas` (beda tujuan, nama sama) | Duplicate `buildResponseZodType()` call, duplicate ACTION_MAP | IR (payload shape sudah harus final dari normalizer) |
| `generateField` | RouteManifest | `api-field.ts` | `fieldMap` lokal | **Orphan output** — tidak ada consumer sama sekali | Hapus, atau alirkan ke `generateRead` |
| `generateRead` | RouteManifest, `routeResponseMap` | `api-read.ts` | — (terima IR dengan benar) tapi re-infer tipe dari SQL raw (`mapSqlTypeToTs`) | Duplicate type-inference system paralel ke Zod (§6, temuan terbesar) | IR — satu resolved-type representation, dua renderer |
| `generateForm` | RouteManifest | `api-form.ts` | — | Belum diverifikasi detail | — |
| `generateMapper` | RouteManifest, `routeResponseMap` | `api-mapper.ts` | `mapperAllRespCount`/`mapperGetOnlyCount` (duplicate traversal dari `contractResponseCount`), `generatedMapperFns` | Duplicate traversal manifest (§3) | IR |
| `HookGenerator` | RouteManifest mentah | `hooks.ts` | 2 fungsi resolusi independen (`resolveBaseResponseName`, `resolveResponseInfo`) | Re-infer resource/model dari nol, tidak terima `routeResponseMap` | IR (baca `RouteResponseComposition`, bukan raw manifest) |
| `SDKGenerator` | RouteManifest mentah | `api.ts` | `getResponseInfo()` — reimplementasi ketiga | Sama seperti HookGenerator | IR |
| `QueryKeyGenerator` | RouteManifest via `route-classifier.ts` | `query-key.ts` | — | Tidak ada — pola benar | Tetap |
| `ConstantsGenerator` | RouteManifest mentah | `constants.ts` | 2 algoritma route-key berbeda di file sama | Duplikasi internal + side-effect cleanup nyasar | Satukan di file sendiri, tidak perlu pindah layer |

---

## 14. Arsitektur Target (Revisi — IR Eksplisit sebagai Pemisah Compilation/Rendering)

```
Laravel
   ↓
PHP Scanner   (fakta: route, resource-link, wrapped, collection, paginated — SUDAH BENAR)
   ↓
Normalized Manifest   (normalizer.ts — SUDAH ADA, tapi perlu diverifikasi benar-benar dikonsumsi)
   ↓
Compiler IR   ← LAPISAN YANG HILANG. Berisi:
   - ResponseResolution (alias-atau-fallback, SATU KALI, ganti 6 implementasi)
   - ResolvedType (SATU representasi kanonik: {kind, nullable, enum values, dst},
                   BUKAN dua sistem inferensi paralel Zod-vs-TS)
   - dihitung SEKALI, immutable, di-pass sebagai parameter ke semua emitter
   ↓
Emitter (RENDER ONLY — tidak ada if/else inferensi tipe, cuma baca IR dan tulis syntax)
   ↓
api-contract.ts, api-schema.ts, api-read.ts, api-form.ts, api-mapper.ts,
hooks.ts, api.ts, query-key.ts, constants.ts
```

**Kesimpulan akhir:** kelemahan terbesar bukan di generatornya satu-satu, tapi memang **tidak ada IR eksplisit antara manifest dan emitter**. `routeResponseMap` sudah membuktikan pola ini *bisa* jalan (dan memang jalan dengan benar, di dalam `ZodTierGenerator`) — masalahnya cuma scope-nya kurang luas (tidak sampai ke `SDKGenerator`/`HookGenerator`) dan tidak mencakup type-resolution (§6), cuma response-composition.

---

## 15. Rekomendasi Refactor (Konkret)

1. **Ekstrak `RouteResponseComposition`/naming resolution** jadi modul bersama (`packages/cli/src/generators/response-resolution.ts`), diekspor dan diimpor oleh `ZodTierGenerator`, `SDKGenerator`, `HookGenerator`. Hilangkan 6 reimplementasi independen.
2. **Satukan 6 `*_ACTION_MAP`** jadi 1 export di `names.ts`: `export const CRUD_ACTION_MAP = {...}`.
3. **Pisahkan `ZodTierGenerator`** jadi 6 class/module terpisah yang masing-masing consume `RouteResponseComposition[]` yang sudah dihitung sekali di awal pipeline (bukan tiap generator hitung ulang) — ini juga yang bikin future refactor "Zod → Valibot" jadi mungkin, karena decision layer (apa yang alias ke apa) terpisah dari emission layer (bagaimana menulis syntax Zod).
4. **Pertimbangkan urutan generate eksplisit** di `sync.ts`: `ZodTierGenerator` generate dulu dan return `routeResponseMap`, baru `SDKGenerator`/`HookGenerator` menerima itu sebagai parameter — bukan `RouteManifest` mentah.

---

## Status Investigasi

Bagian yang **belum** disentuh mendalam dan butuh sesi lanjutan:

- Detail penuh `generateField()` internal (sudah dibaca, dikonfirmasi orphan — lihat §5)
- Detail penuh `generateForm()` — belum diverifikasi konten lengkapnya
- Verifikasi langsung di `sync.ts`: apakah `NormalizedManifest` benar-benar dikonsumsi `ZodTierGenerator.generate()`, atau `RouteManifest` mentah yang dipakai
- Verifikasi apakah `ParsedRoute.stableHash` dipakai untuk skip regenerasi, atau cuma dekorasi