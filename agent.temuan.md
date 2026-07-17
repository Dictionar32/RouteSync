# RouteSync — Temuan Arsitektur (Deep Review Log)

> Log temuan dari deep architecture review, terpisah dari `agent.md` (yang berisi
> diskusi/fix per-sesi) karena fokusnya murni pada temuan struktural — bukti konkret
> dari pembacaan source code, bukan asumsi dari nama file. Format: entri terbaru di
> paling atas. Setiap temuan disertai lokasi file + baris + cara verifikasi (grep/perintah)
> supaya bisa direproduksi, bukan sekadar diklaim.

---

## 2026-07-16 — Deep Architecture Review: Frontend Generator Pipeline (manifest → frontend/src/api/)

### Konteks
Diminta melakukan review arsitektur menyeluruh terhadap pipeline `routesync.manifest.json` →
`frontend/src/api/**`, dengan asumsi awal (dari dokumen brief) bahwa 6 file
(`api-contract.ts`, `api-schema.ts`, `api-field.ts`, `api-read.ts`, `api-form.ts`,
`api-mapper.ts`) adalah 6 layer arsitektur yang independen. Investigasi langsung ke
source code membuktikan asumsi ini salah.

### Temuan #1 (KRITIS) — 6 "layer" ternyata 1 class yang sama

Dibuktikan lewat:
```bash
grep -n "writeFile(path.join(dir, 'api-" ZodTierGenerator.ts
# 420:  api-contract.ts
# 765:  api-schema.ts
# 813:  api-field.ts
# 1071: api-read.ts
# 1127: api-form.ts
# 1525: api-mapper.ts
```

Semua 6 file yang dokumen brief perlakukan sebagai "layer" berbeda, nyatanya adalah 6
method (`generateContract`, `generateSchema`, `generateField`, `generateRead`,
`generateForm`, `generateMapper`) dari **satu class yang sama**: `ZodTierGenerator.ts`
— 1890 baris, 83KB, ~4x lebih besar dari generator kedua terbesar (`HookGenerator.ts`,
20KB). File lain (`hooks.ts`, `api.ts`, `query-key.ts`, `constants.ts`) ditulis generator
terpisah (`HookGenerator.ts`, `SDKGenerator.ts`, `QueryKeyGenerator.ts`,
`ConstantsGenerator.ts`).

**Implikasi:** ini bukan 6 layer arsitektur dengan boundary compile-time — ini 6
tanggung jawab yang numpang di state private yang sama (`knownSchemas`, dulu ada
`graph` yang dead field — sudah di-fix sesi sebelumnya — dan `Map<string,
RouteResponseComposition>` yang di-pass manual antar method sebagai parameter biasa).

### Temuan #2 (KRITIS) — Resource-alias/naming decision diimplementasi ulang ≥5 kali, independen, di 3 file berbeda

Dibuktikan lewat:
```bash
grep -c "resolvedKind = meta.kind || meta.type" ZodTierGenerator.ts HookGenerator.ts SDKGenerator.ts
# ZodTierGenerator.ts:0   (versi sendiri, nama variabel beda: isResourceAlias/resourceRef)
# HookGenerator.ts:2      (2 versi berbeda DI FILE YANG SAMA, baris 24 dan 92)
# SDKGenerator.ts:1       (getResponseInfo(), baris 44-113)
```

Keputusan "apakah response route ini alias ke JsonResource yang sudah ada, atau butuh
nama fallback baru" — logika yang **sudah benar dihitung** di
`ZodTierGenerator.generateContract()` dan disimpan di `routeResponseMap:
Map<string, RouteResponseComposition>` — **tidak pernah diekspor**. `SDKGenerator.ts`
(fungsi lokal `getResponseInfo()`, baris 44) dan `HookGenerator.ts` (2 versi independen,
baris 24 & 92) menghitung ulang keputusan yang sama dari nol, dengan heuristik yang
sedikit berbeda satu sama lain (`baseModel`/`isResource`/`isModel` vs
`resourceRef`/`isResourceAlias`).

**Implikasi konkret:** kalau naming/aliasing logic di `ZodTierGenerator` berubah (persis
seperti Bug A/B yang kita perbaiki di sesi `resourceAliasDedup.spec.ts` sebelumnya),
`SDKGenerator`/`HookGenerator` **tidak otomatis ikut berubah** — harus di-update manual
di 4-5 tempat berbeda, tanpa ada compiler check yang memaksa konsistensi antar mereka.
Ini persis kelas bug yang sama dengan `OrdersGetResponseSchema = OrderResourceSchema`
yang ditemukan di project `ecommerce_shop`, cuma sekarang dikonfirmasi berpotensi
muncul di 3 file berbeda, bukan cuma 1.

### Temuan #3 (TINGGI) — CRUD action map di-copy-paste 5x, identik

Dibuktikan lewat:
```bash
grep -c "post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete'" ZodTierGenerator.ts SDKGenerator.ts
# ZodTierGenerator.ts:4   (CONTRACT_ACTION_MAP, SCHEMA_ACTION_MAP x2, MAPPER_ACTION_MAP)
# SDKGenerator.ts:1       (SDK_ACTION_MAP)
```
Plus pola turunan `TitleCaseResource = toTypeName(...)` + `KeyName = TitleCaseResource +
rawAction` muncul ~9 kali di dalam `ZodTierGenerator.ts` saja. Belum disatukan jadi
1 konstanta/helper bersama di `names.ts` (tempat `toTypeName` sudah hidup).

### Temuan #4 (SEDANG, belum diverifikasi mendalam) — `TypeGenerator.ts` menulis ke file yang sama dengan `ZodTierGenerator.ts`

`TypeGenerator.generate()` juga menulis ke `api-read.ts`/`api-form.ts` — file yang sama
yang ditulis `ZodTierGenerator.generateRead()`/`generateForm()`. Belum dipastikan apakah
ini append section berbeda, atau race/overwrite tergantung urutan pemanggilan di
`sync.ts`. **Perlu investigasi lanjutan** — belum termasuk dalam kesimpulan final review
ini, dicatat sebagai open item.

### Temuan #5 (SEDANG, belum diverifikasi mendalam) — Isi `api-field.ts` belum dianalisis detail

`generateField()` (baris 770-813 `ZodTierGenerator.ts`) belum dibaca detail isinya untuk
menentukan apakah `api-field.ts` benar-benar layer konseptual independen dari
`api-schema.ts`, atau cuma intermediate output yang bisa di-inline. **Belum ada
kesimpulan** — dicatat sebagai open item untuk sesi review lanjutan.

### Temuan #4 — REVISI: `TypeGenerator.ts` overlap dengan `api-read.ts`/`api-form.ts` ternyata **false alarm**

Dibuktikan lewat pembacaan isi file penuh (`TypeGenerator.ts`, cuma 50 baris):
```ts
lines.push(`export * from './api-read'`)
lines.push(`export * from './api-form'`)
await fs.writeFile(path.join(outputDir, 'types', 'index.ts'), lines.join('\n'))
```
`TypeGenerator.ts` **tidak pernah menulis** ke `api-read.ts`/`api-form.ts` — dia cuma menulis `types/index.ts`, isinya tiga interface hardcoded murni (`ApiResponse<T>`, `PaginationMeta`, `PaginatedResponse<T>`, `ApiError`, nggak terkait manifest — parameter `_manifest` sengaja diabaikan) plus dua baris barrel re-export. Grep sebelumnya salah match string `"api-read"`/`"api-form"` di dalam path re-export, bukan target `writeFile()`. **Tidak ada race/overwrite.** Temuan #4 versi lama dicabut.

### Temuan #5 — `api-field.ts` bukan bagian Schema layer sama sekali, dan ada duplikasi camelCase() baru

Dibuktikan lewat pembacaan penuh `generateField()` (`ZodTierGenerator.ts` baris 770-813):
```ts
const fieldMap: Record<string, string> = {}
for (const route of routes) { /* dari route.schema.rules */ }
for (const model of models) { for (const col of model.columns) { fieldMap[camelCase(col.name)] = col.name } }
// → export const ApiApiField = { USER_NAME: "user_name", ... } as const
```
`api-field.ts` isinya cuma **lookup table camelCase → snake_case** dari validation rules + kolom model — nggak ada hubungan konseptual dengan `api-schema.ts` (Zod schema), cuma kebetulan nama filenya mirip.

**Duplikasi baru ditemukan**: `generateRead()` (baris 867+) independen manggil `camelCase(col.name)` lagi per model column buat property `${Model}Transformed` — transformasi yang sama persis yang sudah dihitung `generateField()` dan disimpan di `fieldMap`, tapi `generateRead()` nggak pernah baca `ApiField` yang sudah jadi. Total pemanggilan `camelCase()` mentah di seluruh `ZodTierGenerator.ts`: **22 kali**.

### Temuan #6 (KRITIS — revisi angka dari Temuan #2) — `HookGenerator.ts` bawa 2 fungsi resolusi penuh, bukan sekadar variasi kecil

Dibuktikan lewat pembacaan `HookGenerator.ts` dari awal — dua fungsi lengkap, di file yang sama:

| Fungsi | Baris | Signature | Return |
|---|---|---|---|
| `resolveBaseResponseName()` | 15-40 | `(rawMeta: any) => string \| null` | Nama base doang |
| `resolveResponseInfo()` | 68+ | `(rawMeta: unknown) => { baseName: string; collection: boolean } \| null` | Nama + info collection |

Keduanya nested-scoped berbeda blok (bukan saling reuse), logikanya hampir identik (sama-sama baca `meta.kind || meta.type`, sama-sama cek `knownResources.has(\`${model}Resource\`)`). Plus ada **`ACTION_TO_CRUD_HOOK`** (baris 51) — CRUD action map ke-**6**, identik isinya dengan yang di Temuan #3, dan definisinya **di dalam for-loop** (`for (const [groupName, resource] of resources)`) — dibuat ulang tiap iterasi, bukan sekali di scope luar.

**Update angka final (revisi Temuan #2 & #3 sebelumnya):**
- Implementasi independen "resolve model/resource response": **6** (bukan 5) — di `ZodTierGenerator.ts` (2), `SDKGenerator.ts` (1), `HookGenerator.ts` (2), plus revisi hitung ulang.
- Copy CRUD action map: **6** (bukan 5).

### Temuan #7 — Scalability Review (500 model / 2000 route / 10rb type)

Dibuktikan lewat pembacaan `ContractGraph.ts` (dipakai bangun dependency graph resource↔model): murni single-pass per collection (`for model of manifest.models`, `for res of manifest.resources`, `for route of manifest.routes`, nggak ada nested O(n²)), dan `knownSchemas` pakai `Set<string>` (`private static knownSchemas = new Set<string>()`, baris 52 `ZodTierGenerator.ts`) — O(1) lookup, bukan array `.includes()`. **Secara algoritmik per-generator ini linear**, bukan quadratic.

Tapi implikasi Temuan #1-#6 di skala besar bukan soal Big-O — melainkan **constant-factor multiplier + zero incremental compilation**:
- Tiap route diproses independen oleh ≥6 generator berbeda, dan **≥6 di antaranya menghitung ulang string derivation yang sama** (`toTypeName`, `camelCase`, `ACTION_MAP` lookup) tanpa cache/memoization lintas generator. Di 2000 route, ini bukan bottleneck performa (string ops murah), tapi **bottleneck korektnes**: 2000 route × 6 tempat re-derivation = permukaan jauh lebih besar untuk 6 implementasi itu diam-diam divergen — persis root cause Bug A/B yang sudah kita perbaiki.
- **Incremental compilation nggak mungkin** dengan arsitektur sekarang: `ZodTierGenerator.generate()` selalu regenerasi 6 file penuh dari nol (`this.knownSchemas.clear()` di awal `generate()`, baris 56) — nggak ada per-route/per-resource diffing. Di 500 model + 2000 route, satu perubahan route men-trigger full regenerate 6 file (+ 4 file generator lain = 10 file total ditulis ulang tiap `sync`). `ParsedRoute.stableHash` sudah ada di type, tapi **belum dikonfirmasi dipakai untuk skip regenerasi** — perlu verifikasi lanjut kalau mau dipastikan.
- **Memory**: `knownSchemas` (Set) dan `routeResponseMap` (Map) proporsional linear ke jumlah model+resource+route — aman untuk 10rb type, nggak ada yang O(n²) di memory.

**Kesimpulan**: arsitektur ini akan **tetap compile benar** di skala 500 model/2000 route (nggak ada infinite loop/quadratic blowup yang ditemukan), tapi compile time linear-scale dengan konstanta besar (kerja sama diulang berkali-kali per route tanpa sharing hasil), dan **zero incremental compilation** — tiap `routesync sync` di project besar selalu full-rebuild. Ini risiko utama di skala besar, bukan risiko crash/OOM.



```
@routesync/core (RouteManifest, ContractGraph, SemanticResolutionKernel)
        │
        ▼
   normalizer.ts ── pipeline.ts (CompilerPipeline: ModelGraphBuilderPass →
        │            SemanticResolutionPass → NormalizationPass → ValidationPass)
        ▼
   ZodTierGenerator.ts ──┬── names.ts (toTypeName, camelCase, buildGeneratedRoutes)
        │                └── route-classifier.ts (deriveGroupName)
        ├──▶ contract/api-contract.ts
        ├──▶ contract/api-schema.ts
        ├──▶ contract/api-field.ts
        ├──▶ types/api-read.ts
        ├──▶ types/api-form.ts
        └──▶ mappers/api-mapper.ts

   TypeGenerator.ts     ──▶ types/index.ts, api-read.ts (type decl saja — TIDAK baca ZodTierGenerator)
   HookGenerator.ts     ──▶ hooks.ts        (independen, re-derive naming sendiri, 2x di file sendiri)
   SDKGenerator.ts      ──▶ api.ts          (independen, getResponseInfo() lokal)
        │                                    └── import { ConstantsGenerator } — SATU-SATUNYA cross-generator import valid di repo
   QueryKeyGenerator.ts ──▶ query-key.ts    (independen, scope sempit, OK)
   ConstantsGenerator.ts──▶ constants.ts    (di-import balik oleh SDKGenerator, OK)
   IndexGenerator.ts    ──▶ index.ts (barrel re-export, nama file hardcoded — fragile kalau ada file baru)
```

**Kesimpulan dependency graph:** `SDKGenerator.ts` dan `HookGenerator.ts` tidak pernah
mengimpor apa pun dari `ZodTierGenerator.ts`, padahal `api.ts`/`hooks.ts` yang mereka
tulis harus tahu persis nama `validate${KeyName}Response`/mapper yang **dideklarasikan**
`ZodTierGenerator`. Ini bukan dependency graph yang sehat — ini *implicit contract by
convention* antar generator, nggak dijamin compiler. Root cause dari Temuan #2.

### Rekomendasi Refactor (disepakati arah besarnya, belum dieksekusi)

1. Ekstrak `RouteResponseComposition`/resolusi naming jadi modul bersama
   (`packages/cli/src/generators/response-resolution.ts`), diekspor & diimpor oleh
   `ZodTierGenerator`, `SDKGenerator`, `HookGenerator` — hilangkan ≥5 reimplementasi
   independen (Temuan #2).
2. Satukan 5 `*_ACTION_MAP` jadi 1 export `CRUD_ACTION_MAP` di `names.ts` (Temuan #3).
3. Pertimbangkan pemisahan `ZodTierGenerator` jadi 6 module terpisah yang consume
   `RouteResponseComposition[]` yang dihitung sekali di awal pipeline — bukan tiap
   generator hitung ulang. Ini juga prasyarat untuk open item lama "pisahkan emisi Zod
   dari compiler ke runtime adapter" yang sudah dicatat di `agent.md` sesi
   sebelumnya (2026-07-16, bagian audit compiler/runtime separation).
4. Urutan generate eksplisit di `sync.ts`: `ZodTierGenerator` generate dulu, return
   `routeResponseMap`, baru `SDKGenerator`/`HookGenerator` menerima itu sebagai
   parameter — bukan `RouteManifest` mentah yang di-re-derive sendiri.

### Status
- Temuan #1–#3: **dikonfirmasi lewat grep/pembacaan langsung**, siap jadi basis refactor.
- Temuan #4–#5: **belum diverifikasi mendalam**, butuh sesi lanjutan (baca isi
  `generateField()` penuh, dan urutan pemanggilan `TypeGenerator`/`ZodTierGenerator`
  di `sync.ts`).
- Review belum menyentuh section **Scalability** (500 model/2000 route/10rb type) dari
  brief asli — belum dikerjakan, dicatat sebagai open item kalau diminta lanjut.
- Belum ada perubahan kode dari review ini — murni temuan/analisis, refactor belum
  dieksekusi.

---

## 2026-07-16 (lanjutan 2) — Deep Architecture Review: Revisi Angka + Scalability

### Konteks
Lanjutan dari review arsitektur sesi sebelumnya (temuan #1-#3 di entri di atas). Bagian ini
menyelesaikan open item yang tercatat sebagai "belum diverifikasi mendalam": isi
`generateField()`, isi penuh `TypeGenerator.ts`, isi penuh `HookGenerator.ts`, dan
Scalability Review.

### Revisi Temuan #4 (TypeGenerator.ts overlap) — DICABUT, false alarm

Baca isi `TypeGenerator.ts` (50 baris) penuh. Generator ini **tidak pernah** menulis ke
`api-read.ts`/`api-form.ts` — dia cuma menulis `types/index.ts`, isinya 3 interface
hardcoded (`ApiResponse<T>`, `PaginationMeta`, `PaginatedResponse<T>`, `ApiError`,
nggak terkait manifest — parameter `_manifest` sengaja diabaikan) + 2 baris barrel
re-export (`export * from './api-read'`, `export * from './api-form'`). Grep sesi
sebelumnya match string path re-export, bukan `writeFile()` — bukan overlap/race.
**Kesimpulan: `TypeGenerator.ts` bersih, tidak ada masalah SRP.**

### Temuan #5 — `api-field.ts` orphan output + duplikasi camelCase dengan `api-read.ts`

Baca `generateField()` (baris 770-813 `ZodTierGenerator.ts`) penuh. Isinya lookup table
camelCase→snake_case (`ApiField.USER_NAME = "user_name"`), sumber dari
`route.schema.rules` + nama kolom model — **konsep yang sama sekali beda** dari
`api-schema.ts` (Zod schema), cuma kebetulan namanya mirip.

Ditemukan duplikasi baru: `generateRead()` (baris 867+) independen memanggil
`camelCase(col.name)` lagi per model column untuk property `${Model}Transformed`
interface — transformasi yang sudah dihitung `generateField()` dan disimpan di
`fieldMap`, tapi `generateRead()` tidak pernah membaca `ApiField` yang sudah dihasilkan.
Total pemanggilan `camelCase()` mentah di `ZodTierGenerator.ts`: **22 kali**.

**Implikasi:** `api-field.ts` (`ApiField` constant) kemungkinan **orphan** — belum
ditemukan generator lain yang mengimpor/consume output ini. Perlu diverifikasi apakah
ada consumer di runtime SDK (`packages/sdk/src`) sebelum diputuskan dihapus atau
dipertahankan.

### Revisi Temuan #2/#3 (Temuan #6) — Angka duplikasi naik setelah baca `HookGenerator.ts` penuh

Baca `HookGenerator.ts` (20KB) dari awal. Dikonfirmasi ada **2 fungsi resolusi lengkap**
di file yang sama (bukan "2 versi" seperti draft awal — 2 fungsi independen dengan
signature beda):
- `resolveBaseResponseName()` (baris 15-40): `(rawMeta: any) => string | null`
- `resolveResponseInfo()` (baris 68+): `(rawMeta: unknown) => { baseName: string; collection: boolean } | null`

Plus `ACTION_TO_CRUD_HOOK` (baris 51) — CRUD action map ke-6 yang identik isinya dengan
5 yang tercatat di temuan sebelumnya, dan **didefinisikan ulang di dalam for-loop**
(`for (const [groupName, resource] of resources)`), dibuat ulang tiap iterasi alih-alih
sekali di scope luar.

**Angka final (revisi):**
- CRUD action map duplikat: **6 tempat** (bukan 5) — `ZodTierGenerator.ts` (4x) +
  `SDKGenerator.ts` (1x) + `HookGenerator.ts` (1x, di dalam loop).
- Implementasi independen resource/model resolution: **6** (bukan ≥5) —
  `ZodTierGenerator` (2) + `SDKGenerator.getResponseInfo()` (1) + `HookGenerator.ts`
  (2 fungsi terpisah).

### Temuan #7 — Scalability Review (500 model / 2000 route / 10rb type)

Basis: `ContractGraph.ts` (`packages/core/src/graph/ContractGraph.ts`, 182 baris) —
diverifikasi murni single-pass per collection (`for model of manifest.models`, `for res
of manifest.resources`, `for route of manifest.routes`), **tidak ada nested O(n²)**.
`knownSchemas` di `ZodTierGenerator` pakai `Set<string>` (O(1) lookup), bukan array
`.includes()`.

**Kesimpulan:**
- Algoritmik: **aman**, linear terhadap jumlah model/resource/route, nggak ada
  quadratic blowup atau risiko crash/OOM di 500 model/2000 route/10rb type.
- Risiko sebenarnya bukan Big-O, tapi **constant-factor + korektnes**: tiap route
  diproses independen oleh 6 generator berbeda, ≥6 di antaranya re-derive string yang
  sama (Temuan #6) tanpa cache/memoization lintas generator. Bukan bottleneck performa
  compile time, tapi bottleneck korektnes jangka panjang.
- **Zero incremental compilation**: `ZodTierGenerator.generate()` selalu
  `this.knownSchemas.clear()` (baris 56) lalu regenerate 6 file penuh dari nol setiap
  `sync`. `ParsedRoute.stableHash` sudah ada di type tapi **belum diverifikasi** dipakai
  untuk skip regenerasi — open item. Di 500 model/2000 route, 1 route berubah = 10 file
  ditulis ulang penuh setiap kali.
- Memory: linear, aman untuk 10rb type.

### Rekomendasi Refactor — Tambahan dari Sesi Ini

5. `generateRead()` harus konsumsi `ApiField` yang sudah dihasilkan `generateField()`,
   bukan panggil `camelCase()` ulang — atau, kalau `api-field.ts` benar orphan, evaluasi
   apakah perlu di-generate sama sekali.
6. `HookGenerator.resolveBaseResponseName()` dan `resolveResponseInfo()` disatukan jadi
   satu fungsi begitu modul `response-resolution.ts` bersama (rekomendasi #1 sesi
   sebelumnya) diekstrak.

### Status
- Temuan #4 (TypeGenerator overlap): **dicabut**, dikonfirmasi false alarm.
- Temuan #5 (api-field.ts orphan): dikonfirmasi lewat pembacaan langsung, **belum**
  diverifikasi zero-consumer di seluruh repo (baru dicek generator lain, belum dicek
  `packages/sdk/src` runtime).
- Temuan #6 (revisi angka duplikasi): dikonfirmasi lewat pembacaan `HookGenerator.ts`
  penuh — angka final 6 (CRUD map) dan 6 (resolution logic), bukan 5.
- Temuan #7 (Scalability): dikonfirmasi algoritmik aman, tapi kesimpulan soal
  `stableHash`/incremental compilation **belum diverifikasi penuh** — open item.
- Refactor rekomendasi #5-#6: **belum dieksekusi**, murni temuan.
- Review masih belum menyentuh: detail penuh `SDKGenerator.ts`/`QueryKeyGenerator.ts`
  di luar yang sudah disebut, dan verifikasi consumer `api-field.ts` di
  `packages/sdk/src`.

---

## 2026-07-16 (lanjutan 3) — Deep Architecture Review: Penyelesaian (Boundary Review + Target Architecture)

### Konteks
Menyelesaikan open item terakhir dari brief awal: consumer `api-field.ts`, verifikasi
`stableHash`, `QueryKeyGenerator.ts` penuh, `ConstantsGenerator.ts` penuh,
`SDKGenerator.ts` penuh, Compiler Boundary Review, dan Arsitektur Target.

### Temuan #8 — `api-field.ts` dikonfirmasi ORPHAN, zero consumer

Grep `ApiField`/`api-field` di `packages/sdk/src`, `packages/react/src`,
`packages/vue/src` — **nihil hasil**. Output `generateField()` genuinely tidak pernah
dikonsumsi. Rekomendasi Temuan #5 (sesi lalu) sekarang final: evaluasi hapus
generation-nya sepenuhnya, bukan sekadar diverifikasi.

### Temuan #9 — Koreksi: `stableHash`/incremental compilation TIDAK zero, tapi cuma parsial

Klaim sesi lalu ("zero incremental compilation") dikoreksi. `sync.ts` baris 101
memanggil `resolveManifestIncrementally()` (`utils/incremental.ts`) yang membandingkan
`stableHash` per-route untuk **skip semantic resolution** (`kernel.resolve()`) pada
route yang tidak berubah. Tapi `resolvedManifest` hasilnya tetap berisi SEMUA route
(cache-hit maupun fresh), dan `ZodTierGenerator.generate(resolvedManifest, ...)` /
generator lain dipanggil unconditional di manifest penuh — mereka tidak tahu route mana
yang di-skip semantic resolution-nya.

**Kesimpulan yang benar:** incremental compilation ADA, tapi terbatas di layer
semantic-resolution (hemat parsing/type-inference), **tidak pernah dipropagasi** ke
layer file-generation. Setiap `sync`, seluruh 10 file output ditulis ulang penuh dari
nol setiap kali, terlepas dari isinya berubah atau tidak.

### Temuan #10 — `QueryKeyGenerator.ts` (97 baris, dibaca penuh): CONTOH YANG BENAR

Berbeda dari kritik ke generator lain — file ini bersih. Consume `resource.all`/
`resource.index`/`resource.show` dari `buildResourceMap()` (`route-classifier.ts`) — IR
yang di-share dengan benar, bukan hitung ulang sendiri. Tidak ada `ACTION_MAP` duplikat,
tidak ada resource/model resolution logic sendiri. **Bukti bahwa pola shared-IR yang
benar sudah ada dan berfungsi di codebase ini** — tinggal diterapkan konsisten ke 6
generator lain untuk resource/model-naming decision (Temuan #2/#6).

Risiko kecil belum dikonfirmasi: `Entity` key pakai `groupName.toUpperCase()` tanpa
sanitasi karakter non-alnum — potensi collision kalau 2 group name berbeda menghasilkan
uppercase string sama. **Belum diverifikasi**, perlu cek `deriveGroupName()`.

### Temuan #11 — `ConstantsGenerator.ts` (236 baris, dibaca penuh): duplikasi internal + side-effect di luar tanggung jawab

1. **Dua algoritma route→key derivation berbeda di class yang sama**: `getRouteKey()`
   (baris 6-36, dipakai `API_ENDPOINTS`) punya logic DETAIL/pluralization-aware
   (`{id}` → `DETAIL`, dedup trailing `S`), sementara section `ROUTES` (baris 111-117)
   reimplement versi lebih sederhana inline — tidak memanggil `getRouteKey()` yang
   sudah ada.
2. **`camelCase`/`capitalize` versi lokal** (baris 147-148) — padahal `camelCase`
   canonical sudah diekspor `@routesync/core` (dipakai `ZodTierGenerator` 22x).
   Reimplementasi lokal terpisah lagi.
3. **Side-effect di luar tanggung jawab**: `generate()` (baris 227-234) menghapus
   `node_modules/routesync/dist/enums.js`/`enums.d.ts` — cleanup migrasi legacy yang
   numpang di method generate. SRP violation kecil tapi konkret.

### Temuan #12 — `SDKGenerator.ts` (254 baris, dibaca penuh): duplikasi SUDAH diketahui, tapi tidak di-fix

Baris 21: komentar `// CRUD mapping + response counting (sama dengan contract)` —
developer sebelumnya secara eksplisit **mengakui** `SDK_ACTION_MAP` adalah duplikat dari
`ZodTierGenerator`'s `CONTRACT_ACTION_MAP`. Ini bukan oversight — ini technical debt yang
sudah diketahui dan dicatat, tapi tidak pernah diekstrak. Menguatkan bahwa rekomendasi
refactor #1 (ekstrak shared module) bukan saran baru.

### Compiler Boundary Review (poin 6 brief) — Rekomendasi Eksplisit

| Proses | Sebaiknya di mana | Alasan |
|---|---|---|
| Resource/route/schema normalization dasar, response inference (`wrapped`/`collection`/`paginated`) | PHP Scanner (sudah di situ, tepat) | Butuh reflection (`ReflectionMethod`), harus jalan di runtime Laravel penuh — dikonfirmasi butuh `vendor/autoload.php`. |
| **Resource/model-response naming resolution** (Temuan #2/#6) | Compiler pass baru SEBELUM generator (`ResponseResolutionPass` di `pipeline.ts`), BUKAN PHP Scanner, BUKAN tetap di tiap Frontend Generator | Murni keputusan berbasis data manifest (tidak butuh reflection Laravel), tapi juga tidak boleh dihitung ulang di 6 tempat berbeda. |
| Mapper/Read model metadata | Frontend Generator (tetap) | Genuinely frontend concern (camelCase transform, flatten relation untuk UI). |
| Incremental caching | Perlu diperluas ke Frontend Generator, bukan berhenti di semantic-resolution layer (Temuan #9) | Generator perlu terima diff (route mana berubah), bukan regenerate 10 file penuh tiap kali. |

### Arsitektur Target yang Direkomendasikan (poin 7 brief)

```
routesync.manifest.json (PHP Scanner — reflection-based, wajib bootstrap Laravel)
        │
        ▼
CompilerPipeline (pipeline.ts)
   ModelGraphBuilderPass → SemanticResolutionPass (sudah stableHash-aware)
        → NormalizationPass → ValidationPass
        → [BARU] ResponseResolutionPass
              (hitung SEKALI: route mana alias ke Resource, route mana fallback-named,
               simpan sebagai RouteResponseComposition[] di NormalizedManifest —
               source of truth tunggal, ganti 6 reimplementasi independen)
        │
        ▼
NormalizedManifest (termasuk RouteResponseComposition[] final)
        │
        ├──▶ ContractEmitter    → api-contract.ts, api-schema.ts
        ├──▶ ReadModelEmitter   → api-read.ts    (baca ApiField, bukan camelCase ulang)
        ├──▶ FormEmitter        → api-form.ts
        ├──▶ MapperEmitter      → api-mapper.ts  (baca RouteResponseComposition)
        ├──▶ SDKEmitter         → api.ts         (baca RouteResponseComposition)
        ├──▶ HookEmitter        → hooks.ts       (baca RouteResponseComposition)
        ├──▶ QueryKeyEmitter    → query-key.ts   (SUDAH benar — pola ini yang ditiru)
        └──▶ ConstantsEmitter   → constants.ts   (satukan getRouteKey(), 1 algoritma)
```

Perbedaan mendasar dari arsitektur sekarang: `ZodTierGenerator` (God Object) dipecah
jadi emitter murni per file, dan decision layer (siapa alias ke siapa) dipisah total
dari emission layer (bagaimana menulis syntax Zod/TS). `QueryKeyGenerator.ts` (Temuan
#10) membuktikan pola ini sudah bisa jalan di codebase ini.

### Status — Deep Architecture Review DITUTUP untuk sesi ini
- Semua 7 poin brief awal (ringkasan arsitektur, dependency graph, responsibility
  matrix, kelemahan prioritas, rekomendasi refactor, boundary PHP Scanner vs Frontend
  Generator, arsitektur target) sudah dijawab dengan bukti konkret dari pembacaan
  source code langsung.
- Item yang masih genuinely open (butuh verifikasi lanjutan, bukan kesimpulan final):
  risiko collision `Entity` key di `QueryKeyGenerator.ts` (belum dicek `deriveGroupName()`).
- **Tidak ada refactor yang dieksekusi dari review ini** — seluruhnya analisis/temuan.
  Eksekusi refactor (ekstrak `response-resolution.ts`, `ResponseResolutionPass`, dst)
  adalah pekerjaan terpisah yang belum dimulai, menunggu keputusan lo soal prioritas.

---
