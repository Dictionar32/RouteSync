# RouteSync — Agent Log

> Log diskusi & temuan arsitektur, format changelog: entri terbaru di paling atas,
> entri lama di bawah. Setiap entri baru ditambahkan sebagai section baru di atas
> section sebelumnya — jangan menimpa entri lama.

---

## 2026-07-16 (lanjutan) — Resource Dedup Test Refinement, ZodTierGenerator/normalizer Type Fixes, Known Issues

### Konteks
Tiga bagian: (1) merapikan `resourceAliasDedup.spec.ts` dari framing "route" ke framing "api-contract.ts = registry kontrak backend", (2) verifikasi end-to-end terhadap manifest asli project `ecommerce_shop`, (3) memperbaiki 17 + 11 TS compile error di `ZodTierGenerator.ts` dan `normalizer.ts`.

### 1. `resourceAliasDedup.spec.ts` — reframing dari "route" ke "registry kontrak"
- `describe` di-rename: dari `"resource-backed routes must not duplicate the Resource contract"` menjadi `"emits backend contracts exactly once per JsonResource"` — fokus test sekarang pada apa yang di-emit api-contract.ts, bukan perilaku route.
- Test triad (`OrderResourceSchema`/`OrderResourceResponse`/`validateOrderResource`) di-merge, judul lama yang duplikat dihapus.
- Bug A (blacklist `OrderIndexResponseSchema`/`CheckoutResponseSchema`/`BuyNowResponseSchema` dst) digeneralisasi jadi regex per-suffix CRUD (`\w*IndexResponseSchema`, `\w*ShowResponseSchema`, dst) — supaya nggak tergantung nama resource/route spesifik.
- Bug B (`OrderResponseSchema`, naming branch `count === 1`) tetap dipertahankan sebagai test terpisah — beda root cause dari Bug A, jangan digabung.
- Mapper test pakai word-boundary regex (`\bOrderShowResponse\b`) dan **tidak** menambahkan test yang mengikat ke nama fungsi generator internal (`toOrdersShowResponseRead` dst) — disepakati eksplisit karena itu bikin test rapuh terhadap refactor nama fungsi, padahal bukan bagian dari kontrak yang dijaga.

### 2. Verifikasi terhadap manifest asli `ecommerce_shop`
- `routesync.manifest.json` yang dicek ternyata **stale** — kosong `resources[]`/`models[]`, cuma `routes[]`. Root cause: di `sync.ts`, `manifest.models`/`manifest.resources` cuma diisi kalau flag `--models` dipassing (`if (options.models) { manifest.models = models; manifest.resources = resources }`). Compile terakhir kemungkinan nggak pakai `--models --zod`.
- Output lama di `frontend/src/api` (yang sempat dicurigai py bug alias `OrdersGetResponseSchema = OrderResourceSchema`) dikonfirmasi user sebagai **artifact lama**, bukan representasi generator/manifest terkini — bukan bug aktif.
- Re-run `sync` di sandbox gagal karena project nggak punya `vendor/` (Composer) dan sandbox nggak punya akses ke packagist.org — perlu dijalankan di mesin lokal (`annas-zen@archlinux`) dengan `routesync sync --input routes/api.php --output frontend/src/api --models --zod`.

### 3. Fix TS compile error — `ZodTierGenerator.ts` (17 error → 0)
Root cause utama: gap deklarasi type untuk field runtime yang genuinely dipakai (`wrapped`, `code`), bukan bug logic:
- `private static graph!: ContractGraph` — TS **melarang** `!` definite-assignment assertion di **static** class property (limitation resmi TS, direproduksi dengan minimal repro). Field-nya ternyata write-only (nggak pernah dibaca), jadi cukup diganti `ContractGraph | undefined`.
- `wrapped?: boolean` ditambahkan ke `ResponseMetadata` (`packages/core/src/types/route.ts`) — field ini sudah lama dipakai runtime (`LaravelRouteParser.ts` set `$responseMetadata['wrapped']`) dan dites di `jsonResourceWrap.spec.ts`/`code.spec.ts`/`resourceAliasDedup.spec.ts`, tapi belum pernah dideklarasikan di type.
- `code?: string` dan `fields?: Record<string, unknown>` ditambahkan ke `RuntimeAugmented` (`normalizer.ts`) — field raw AST literal node dari PHP extractor, sama polanya: dipakai runtime, belum dideklarasikan.
- `baseMeta = getSemanticNode(...) || {}` → buang fallback `|| {}` (bikin TS infer union termasuk `{}` yang nggak punya properti apa pun walau diakses via `?.`).
- Dua spread object (`respMeta`, `meta`) yang menggabungkan field lintas-varian discriminated union `ResponseMetadata` (`model` vs `resource` vs `object`) — sengaja baca cross-variant, jadi di-type longgar `Record<string, any>`.

### 4. Fix TS compile error — `normalizer.ts` (11 error → 0)
- 2x `kernel.resolve(ast, context)` → `ast as any` (ikut pola "safe boundary cast" yang sudah ada di file yang sama).
- `Object.values(field.fields).forEach(f => patchField(f as RuntimeAugmented))`.
- **Sempat salah diagnosis**: awalnya dikira `route.uri`/`route.actionName`/`route.controllerName` nggak exist sama sekali (diganti ke `route.path`/`route.action`) — ternyata `normalizer.spec.ts` (test `PaymentIndex`) membuktikan field itu memang dipakai di manifest hand-authored/legacy. Perbaikan salah ini bikin regresi 1 test (`expected 'PaymentIndex' to be 'index'`), langsung ketauan dari full test run dan direvert.
- Fix yang benar: tambahkan `uri?`, `actionName?`, `controllerName?` sebagai field **legacy/opsional** di `ParsedRoute` (route.ts), coexist dengan `path`/`action` yang lebih baru — dengan komentar jelas kenapa dua konvensi ini hidup berdampingan.

### 5. Test baru: `packages/sdk/tests/generatorTypeSafety.spec.ts` (6 test)
Regression guard untuk memastikan fix-fix di atas nggak "diperbaiki" lagi di masa depan dengan cara **menghapus** kode pembaca field, bukan benerin type-nya. Meng-cover end-to-end (bukan cuma `tsc --noEmit`):
- `wrapped:true` pada resource response (via `.resolved`) dan pada model response (langsung di `route.response.wrapped`).
- Nested `kind: 'object'` field dengan `fields` map bersarang (exercise `patchField`/`resolveResponse` recursion).
- Raw literal AST node `{"kind":"literal","code":"..."}` — kalau `code` berhenti dibaca, harusnya degradasi ke `z.unknown()`, test ini nangkep itu.
- Legacy route shape (`uri`/`actionName`/`controllerName`) tetap diterima `normalizeManifest` tanpa throw.

### Status Test
- `resourceAliasDedup.spec.ts`: 6/6 hijau.
- Full suite setelah semua fix: **149/149 test hijau** (18 file), termasuk spec baru.
- `npx tsc --noEmit` bersih untuk `ZodTierGenerator.ts`, `normalizer.ts`, `route.ts`.

### Known Issues (belum diperbaiki, butuh keputusan arsitektur)

1. **Dua interface `ModelNode` dengan nama sama, struktur beda.**
   - `packages/core/src/types/semantic.ts`: `{ kind: 'model_node', fields?: Record<string,string>, layer: 'model' (required), confidence: number (required) }` — dipakai `ServiceGraph`.
   - `packages/core/src/semantic/types.ts`: `{ fields?: Record<string,{type,nullable}>, layer?: string (optional), tanpa kind/confidence }` — dipakai `SemanticResolutionKernel.loadGraph`.
   - Saat ini di-cast `as any` di `normalizer.ts` (`buildModelGraph`) dengan komentar penjelas, **bukan** solusi permanen. Perlu rename/merge salah satunya.
   - Cascading error dari konflik ini (ditemukan saat full-project `tsc --noEmit`, semua **preexisting**, bukan dari sesi ini): `packages/cli/src/generators/passes.ts`, dan turunannya di `scan.ts`/`sync.ts` (`ScannedManifest` tidak assignable ke `RouteManifest` — missing `version`/`baseURL`/`generatedAt`), serta beberapa test (`compiler.spec.ts`, `normalizer.spec.ts`, `orders.spec.ts`, `pluralVariableResolution.spec.ts`) yang punya error type serupa (`ResolverMeta` union ketat, `FileSpan` shape berubah, dll).
   - Belum ditindaklanjuti — di luar scope sesi ini, butuh keputusan arsitektur eksplisit, bukan cast cepat.

2. **`IntentResolver.ts`**: `Property 'model' does not exist on type 'ResponseMetadata'` (baris 42) dan `'capabilities' does not exist in type 'DomainIntentConfig'` (baris 162) — belum diperbaiki, sama-sama muncul dari full-project typecheck, bukan bagian dari fix sesi ini.

3. **`ecommerce_shop` project**: `routesync.manifest.json` yang di-commit stale (kosong `resources[]`/`models[]`). Perlu re-run `routesync sync --models --zod` di mesin lokal untuk menyinkronkan manifest dengan kode di `frontend/src/api`, dan supaya `resourceAliasDedup` logic beneran ke-exercise di project real (saat ini controller-nya kemungkinan belum expose `JsonResource` ke extractor sama sekali).

---



### Konteks
Sesi ini berfokus pada tiga hal: (1) membuat test suite untuk memverifikasi hasil split `api-schema.ts` / `api-contract.ts`, (2) memperbaiki dua bug lama di `ExpressionResolver` yang baru ketahuan saat test suite dijalankan, dan (3) menemukan bahwa perubahan di `@routesync/core` harus diikuti `npm run build` karena package dikonsumsi dari `dist/` yang sudah di-compile.

### Temuan & Perbaikan

1. **Test Suite: Payload / Response File Split (`payloadSplit.spec.ts`)**
   - Dibuat `packages/sdk/tests/payloadSplit.spec.ts` dengan 25 test terbagi 5 describe block:
     - **ZodTierGenerator: api-schema.ts** — verifikasi `*PayloadSchema`, `*Payload` type, `validate*Payload`, panggilan `.parse()`, dan tidak ada `*ResponseSchema` di dalamnya.
     - **ZodTierGenerator: api-contract.ts** — verifikasi model schema, `*ResponseSchema`, `validate*Response`, dan tidak ada `*PayloadSchema` / `*Payload` di dalamnya.
     - **SDKGenerator: api.ts** — verifikasi import `validate*Payload` dari `./contract/api-schema`, tidak dari `api-contract`, dan wiring `body:` / `response:` yang benar.
     - **HookGenerator: hooks.ts** — verifikasi tidak ada import `*Payload` dari `api-contract`.
     - **File split invariant** — kedua file exist, non-empty, dan exported names benar-benar **disjoint** (tidak ada overlap sama sekali).
   - Saat run pertama, 5 test gagal karena nama yang di-generate menggunakan prefix `Api` (misal `ApiProductsCreatePayloadSchema`). Test disesuaikan menggunakan regex `\w+` generik daripada hardcode nama.

2. **Bug Fix: `nullsafe_property_access` (`?->`) Tidak Nullable (Issue #15)**
   - `ExpressionResolver` path `property_access / nullsafe_property_access` spread `innerRes.nullable` verbatim setelah resolve `model_column`. Karena kolom bisa `nullable: false` di DB, operator `?->` diabaikan.
   - Fix: tambah `const isNullsafe = meta.kind === 'nullsafe_property_access'` dan `nullable: isNullsafe ? true : innerRes.nullable`.

3. **Bug Fix: Ternary dengan Branch `null` Tidak Nullable (Issue #14)**
   - `ExpressionResolver` ternary handler spread `...truthyRes` tanpa memeriksa apakah falsy branch adalah `null`. Akibatnya `$path ? 'url' : null` menghasilkan `string` (non-nullable).
   - Fix: tambah `truthyIsNull` / `falsyIsNull` guard. Jika non-null branch dipilih dan sisi lainnya adalah `null`/`unknown`, `nullable: true` di-attach ke hasil.

4. **Catatan Penting: `@routesync/core` dari `dist/`**
   - Vitest test mengkonsumsi core dari `../../dist/core.js` (bukan source langsung). Perubahan di `packages/core/src/` **tidak aktif sampai `npm run build` dijalankan** di root workspace.
   - Pattern ini harus diingat setiap kali ada fix di `@routesync/core`.

### Status Test
- Setelah `npm run build`: **101/101 test hijau** (semua file spec).
- Dua test lama di `orders.spec.ts` yang sebelumnya fail ikut diperbaiki sebagai side-effect dari fix ExpressionResolver.

---

## 2026-07-16 — Plural Variable Resolution & Wrap Detection Edge Cases

### Konteks
Melanjutkan penyelesaian bug wrap detection dan memecahkan masalah variabel model plural (seperti `$categories`) yang tidak ter-resolve otomatis ke tipe model singular-nya (`Category`) pada request tanpa resource class Laravel.

### Temuan & Perbaikan

1. **Plural-to-Singular Model Heuristic (VariableResolver)**
   - **Masalah:** Route `categories.get` mengembalikan JSON array langsung (`return response()->json(['data' => $categories])`). Karena variabelnya bernama `categories` (plural) sedangkan nama model di database/manifest adalah `Category` (singular), `VariableResolver` gagal mencocokkannya sehingga menghasilkan `z.unknown()`.
   - **Perbaikan:** Menambahkan aturan singularisasi heuristik standard Laravel di `packages/core/src/semantic/plugins/VariableResolver.ts`. Jika nama variabel diakhiri dengan `ies` (misal `categories` -> `category`) atau `s` (misal `products` -> `product`), resolver akan mencoba mencari model singular tersebut dan melabelinya dengan `collection: true`.
   - **Hasil:** `CategoriesResponseSchema` berhasil ter-resolve secara otomatis menjadi `z.object({ data: z.array(CategorySchema) })` tanpa memaksa developer menambahkan atribut `#[Response]` secara manual di controller.

2. **Wrap Detection Edge Cases & Regression Tests (LaravelRouteParser)**
   - **Masalah:** Masalah multi-escaping backslash pada regex parse route Laravel menyebabkan route parser pecah ketika dijalankan (mengembalikan 0 routes di test).
   - **Perbaikan:** Memindahkan logika wrap detection PHP string regex ke `String.raw` template literal (Issue #10) untuk menghindari double-escaping hell.
   - **Perbaikan Resolusi FQCN & Alias:** Memperbaiki deteksi use-statement yang ter-indent di dalam namespace block (Issue #12) dan mendukung aliased imports `use X as Y` dengan membuang syarat akhiran kata `Resource` di regex (Issue #13).
   - **Unit & Regression Tests:** Menambahkan 4 named regression tests spesifik di `packages/sdk/tests/jsonResourceWrap.spec.ts` dan 4 unit tests baru di `packages/sdk/tests/pluralVariableResolution.spec.ts` untuk memastikan kestabilan fungsionalitas ini.

3. **Splitting Request Payloads to `api-schema.ts`**
   - **Masalah:** File `api-contract.ts` menjadi sangat panjang karena menampung data response backend sekaligus schema request payload untuk create, update, dan delete (e.g. `XxxCreatePayloadSchema`).
   - **Perbaikan:** Memindahkan emisi standalone request payload schemas (`*PayloadSchema`, `*Payload` types, dan `validate*Payload` validator functions) dari `api-contract.ts` ke `api-schema.ts`. `api-contract.ts` sekarang bersih dan hanya berfokus pada schema response backend (`*ResponseSchema`).
   - **Integrasi SDK & Hooks:** Menyesuaikan impor validator di `SDKGenerator.ts`, `HookGenerator.ts`, dan `ZodTierGenerator.ts` agar mengambil payload schema secara dinamis dari `api-schema` alih-alih `api-contract`.


---

## 2026-07-15 — Debugging Runtime: Urutan yang Benar & SDK Fix Items

### Konteks

Sesi debugging integrasi `toko-online` (Laravel + Next.js + RouteSync SDK). Tiga bug
terpisah yang awalnya dikira satu masalah compiler, ternyata masalah runtime dan PHP.

### Temuan #1 — Urutan debugging yang benar

**Salah (yang terjadi di sesi ini):**
```
error "Gagal memuat data"
↓ langsung ke ExpressionResolver
↓ langsung ke compiler schema
↓ langsung ke Zod nullable
```

**Benar:**
```
error "Gagal memuat data"
↓ 1. Cek Network tab — apakah request sampai? (CORS? 401? 500?)
↓ 2. Curl langsung ke backend dengan token valid
↓ 3. Bandingkan response asli vs schema yang digenerate
↓ 4. Baru sentuh compiler/SDK kalau memang schema yang salah
```

Pelajaran: **jangan sentuh SDK sebelum membuktikan dengan curl bahwa sumber
masalahnya ada di SDK.**

### Temuan #2 — CORS bukan masalah SDK

`NEXT_PUBLIC_API_URL=http://toko-online.test/api` menyebabkan browser block semua
request karena cross-origin (`localhost:3000` → `toko-online.test`).

Fix yang benar: Next.js `rewrites()` proxy di `next.config.ts` + ganti env ke `/api`.
Ini **bukan** masalah yang perlu difixed di SDK — SDK tidak tahu soal CORS.

**Action item untuk SDK docs:** tambahkan section "Development Setup" di README
yang menjelaskan bahwa `NEXT_PUBLIC_API_URL` harus menggunakan relative path
(`/api`) dan `next.config.ts` harus dikonfigurasi dengan `rewrites()` proxy,
bukan langsung ke domain backend.

### Temuan #3 — `JsonResource $wrap` tidak dideteksi compiler

Laravel `JsonResource` secara default membungkus response single resource dalam
`{ data: {...} }`. RouteSync scanner membaca `#[Response(Order::class)]` dan
menghasilkan schema flat tanpa wrapper — tetapi tidak mendeteksi apakah controller
return `new OrderResource(...)` (yang menyebabkan wrapper) atau `$model->toArray()`
(yang tidak menyebabkan wrapper).

Akibatnya schema Zod yang digenerate gagal memvalidasi response yang dibungkus `data:`:

```
Backend mengirim:   { data: { id: 1, status: "pending", ... } }
Zod schema expect:  { id: 1, status: "pending", ... }  ← Zod throw
```

Workaround saat ini: tambah `public static $wrap = null;` di `OrderResource.php`.

**Action item untuk SDK compiler:** scanner perlu mendeteksi apakah route mengembalikan
`new XxxResource(...)` vs `$model->toArray()` dan menambahkan atau tidak menambahkan
`z.object({ data: ... })` wrapper di schema yang digenerate. Atau, sebagai alternatif
yang lebih sederhana, tambahkan warning di output `sync` kalau compiler mendeteksi
`JsonResource` tanpa `$wrap = null`.

### Temuan #4 — Hydration mismatch di pages yang cek `isAuthenticated`

Zustand store tidak tersedia di SSR. Semua page yang melakukan:
```tsx
if (!isAuthenticated) return <AuthGuard />
```
akan menyebabkan hydration mismatch karena server selalu render `AuthGuard`,
klien bisa render sesuatu yang berbeda setelah store ter-hydrate.

Pola fix yang benar:
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])

if (!mounted || !isAuthenticated) return <AuthGuard />
```

**Action item untuk generated code:** kalau RouteSync men-generate page yang
membutuhkan auth guard, pola `mounted` ini harus ada di template generator,
bukan dibiarkan developer menemukan sendiri.

### Ringkasan Action Items (urutan prioritas)

1. **`JsonResource $wrap` detection** — compiler harus deteksi dan handle wrapper
   atau emit warning. Prioritas: **tinggi** (silent validation failure, sulit debug).
2. **README: Development Setup section** — dokumentasikan kebutuhan Next.js proxy
   untuk avoid CORS di dev. Prioritas: **sedang**.
3. **Auth guard template** — generated auth-guard page harus pakai pola `mounted`.
   Prioritas: **sedang**.

---

## 2026-07-08 — Compiler Reframe: Findings & Open Items

Ringkasan diskusi tentang reframing RouteSync dari "route/frontend generator" menjadi
"source-to-source compiler" (Laravel → Next.js). Ditulis berdasarkan inspeksi langsung ke
kode di `packages/*` dan dokumen di `compiler/*`, bukan asumsi.

### Definisi Produk (disepakati)

> "A compiler that transforms Laravel applications into production-ready Next.js frontends
> by analyzing backend semantics and generating type-safe APIs, forms, validation, and
> data-fetching layers."

Versi Indonesia:

> "Compiler yang mengompilasi aplikasi Laravel menjadi aplikasi frontend Next.js yang
> type-safe, dengan runtime berbasis Axios, TanStack Query, React Hook Form, Zod, dan
> Hook Form Resolvers."

Poin penting: **Axios, TanStack Query, React Hook Form, Zod, Hook Form Resolvers bukan
target compiler — mereka adalah runtime yang dipilih.** Target compiler tetap "Next.js
Application". Konsekuensinya:

```
Compiler (tidak berubah)
├── Parser
├── Semantic Engine
├── Analyzer
└── IR (Manifest)

Emitter (yang berubah kalau ganti runtime)
├── Next.js Emitter
│   ├── Axios Runtime
│   ├── TanStack Query Runtime
│   ├── React Hook Form Runtime
│   └── Zod Runtime
├── React Native Emitter (future)
├── Vue Emitter (future)
└── Svelte Emitter (future)
```

### Visi ini SUDAH ada di repo, tapi implementasinya belum konsisten

Folder `compiler/` di root sudah berisi 27 dokumen arsitektur: `Constitution.md`, `IR.md`,
`Passes.md`, `Optimizer.md`, `PluginAPI.md`, `CompilerArchitectureAudit.md`, dll.
Konstitusinya sudah eksplisit menyatakan:

> "Generator tidak boleh melakukan inferensi semantik. Semua inferensi, resolusi, dan
> optimasi harus selesai di Middle-end. Backend generator hanya boleh membaca IR dan
> menghasilkan artefak target."

Masalahnya: dokumentasi ini sebagian bersifat **aspirasional**, sementara kode aktual belum
sepenuhnya mematuhinya. Berikut temuan konkret dari inspeksi kode.

### Temuan #1 — `IntentResolver` masih melanggar konstitusinya sendiri

`compiler/CompilerArchitectureAudit.md` (judul: *"Generator Semantic Leakage"*) berstatus
**"Completed Refactor"**, mengklaim `HookGenerator.ts` sudah 100% dumb emitter setelah
logikanya dipindah ke `packages/cli/src/resolvers/IntentResolver.ts`.

Kenyataan di kode (`packages/cli/src/resolvers/IntentResolver.ts`):

```ts
let qtyField = 'qty'   // fallback masih hardcoded
...
return nameLower === 'qty' || nameLower === 'quantity' || nameLower === 'jumlah' || nameLower === 'count'
```

Ini masih **string-matching manual** terhadap nama kolom, bukan derivasi deterministik dari
`route.raw.schema.rules` via `toIdentifier` (rencana yang sedang dikerjakan). Artinya
`IntentResolver` sendiri masih melakukan bentuk inferensi semantik heuristik — audit
dokumennya perlu dianggap "in progress", bukan selesai, sampai fallback ini dihapus.

**Action item:** ganti heuristik nama field di `IntentResolver` dengan derivasi asli dari
`schema.rules` pada `ParsedRoute`, sehingga tidak ada lagi daftar kata kunci hardcoded
(`qty`/`quantity`/`jumlah`/`count`) atau default `'qty'`.

### Temuan #2 — CLI belum mencerminkan framing compiler

`packages/cli/src/index.ts`:

```ts
program
  .name('routesync')
  .description('Laravel routes to typed frontend SDKs')  // framing generator lama
```

Command yang tersedia: `scan`, `generate`, `sync`, `watch`, `annotate`, `explain`, `audit`.
Tidak ada `build` — padahal contoh di diskusi sebelumnya memakai `routesync build` sebagai
entry point compiler pipeline (parse → resolve → analyze → optimize → emit).

**Action item (opsional, prioritas rendah):** pertimbangkan rename/alias command dan
description agar konsisten dengan framing compiler, setelah struktur inti stabil.

### Temuan #3 — Pemisahan Compiler/Runtime sudah benar di layer Hooks, belum di layer Zod

**Sudah sesuai visi: `HookGenerator` → `packages/react`**

`HookGenerator.ts` (bagian compiler, di `packages/cli`) **tidak pernah** menyentuh TanStack
Query secara langsung. Ia hanya emit:

```ts
import { defineHooks, useAggregateCollectionIntent } from 'routesync/react'
```

Baru di `packages/react/src/hooks/defineHooks.ts` (paket runtime, bukan compiler) muncul:

```ts
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query'
```

Ini persis pola yang diinginkan: compiler tidak tahu apa-apa soal TanStack Query, ia hanya
tahu "ada intent hook bernama X". `packages/react` berperan sebagai **Next.js Emitter
runtime**. Kalau besok ingin ganti ke SWR, yang berubah cukup `packages/react` (atau
package runtime baru), bukan `HookGenerator`.

**Belum sesuai visi: `ZodTierGenerator`**

`ZodTierGenerator.ts` juga berada di `packages/cli` (bagian compiler), tapi ia emit kode
Zod secara **literal langsung** di generator itu sendiri:

```ts
lines.push(`import { z } from 'zod'`)
...
if (expr.type === 'number') return 'z.number()'
if (expr.type === 'boolean') return 'z.boolean()'
```

Tidak ada abstraksi runtime perantara (semacam `routesync/validation`). Logika "bagaimana
AST expression dipetakan ke validator" menyatu langsung dengan syntax Zod, bukan diserahkan
ke IR netral yang baru di-emit oleh backend Zod-spesifik.

**Kesimpulan gap:** layer validasi (Zod) masih di level *"compiler tahu targetnya Zod"*,
sedangkan layer hooks (TanStack) sudah di level *"compiler tidak tahu targetnya apa"*.
Kalau mau swap Zod → Valibot semudah swap TanStack → SWR, `ZodTierGenerator` perlu
direfactor mengikuti pola yang sama seperti `HookGenerator`/`packages/react`.

**Action item:** pisahkan `ZodTierGenerator` menjadi IR-neutral schema description, lalu
emit ke package runtime terpisah (misal `packages/zod-runtime` atau ekspor dari
`@routesync/sdk`), sama seperti pola hooks.

### Ringkasan Open Items (urutan prioritas yang didiskusikan)

1. **`IntentResolver` / `schema.rules`** — hapus heuristik nama field hardcoded, ganti
   dengan derivasi dinamis dari `ParsedRoute.raw.schema.rules` + `toIdentifier`. *(sedang
   dikerjakan sebelum diskusi ini)*
2. **`ZodTierGenerator` refactor** — pisahkan emisi Zod dari compiler ke runtime adapter,
   mengikuti pola `HookGenerator` → `packages/react`.
3. **CLI naming/description** — selaraskan dengan framing compiler (`build` command,
   description baru), prioritas rendah, dikerjakan setelah struktur inti stabil.
4. **Reorganisasi folder** (opsional, besar) — dari `packages/cli/src/{parsers,resolvers,
   generators}` menjadi struktur `compiler/{parser,semantic,analysis,optimizer,emitter,cli}`
   seperti yang digambarkan di diskusi awal. Disarankan dikerjakan **setelah** item 1–2
   selesai agar tidak memindah kode yang masih berubah.