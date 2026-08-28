# Changelog

All notable changes to RouteSync will be documented in this file.

## [Unreleased]

### Added
- **`inlineModelCollectionCamelCase.spec.ts`** — Suite regresi baru yang memverifikasi preservasi struktur (tanpa structural flattening seperti `summaryAvgRating` atau `reviewsData`), ekspansi kolom model `ProductReview`, dan transformasi field `snake_case` $\rightarrow$ `camelCase` pada `api-read.ts` dan `api-mapper.ts` secara 100% type-safe tanpa `any` (Issue #22).
- **`inlineResponseCamelCaseTransformation.spec.ts`** — Suite regresi baru yang memverifikasi ekstraksi inline controller response (`Profile`, `Login`, `ProdukReviews`, dll.) ke dalam interface `*Transformed` di `api-read.ts` dan transformasi mapper `to*Read` dari `snake_case` API response ke `camelCase` domain objects (Issue #21).
- **`eloquentOnlyReadMappers.spec.ts`** — Suite regresi baru yang memverifikasi bahwa `MapperGeneratorPass` hanya menghasilkan read mapper untuk Eloquent JsonResources (Kategori A) dan mengabaikan identity mapper untuk respons non-resource (Kategori B seperti `Profile`, `PaymentWebhook`, `Login`).
- **`strictChildResourceMapperTyping.spec.ts`** — Suite regresi baru untuk menguji ekstraksi child resource yang *reachable* tanpa route top-level (`OrderDetailResource`) dan pengetikan strict `OrderDetailResourceApiResponse`.
- **`existingContractMapperTyping.spec.ts`** — Suite regresi baru yang menguji resolusi dinamis tipe contract `*ApiResponse` dari `availableContractTypes` pada `MapperGeneratorPass` tanpa bergantung pada flag `isTopLevel`.
- **`e2eMapperGeneration.spec.ts`** — Suite regresi End-to-End baru yang memverifikasi alur penuh dari `RouteManifest` (`OrderDetailResource::collection`) $\rightarrow$ `manifestToContractInput` $\rightarrow$ `MapperGeneratorPass` untuk menghasilkan mapper `items: api.items?.map(toOrderDetailResourceRead)` yang valid tanpa terdegradasi.
- **`itemsCollectionMapperTypeResolution.spec.ts`** — Suite regresi baru yang menguji resolusi pengetikan koleksi child resource `items: OrderDetailResourceTransformed[]` dan pemetaan `items: api.items ? api.items.map(toOrderDetailResourceRead) : []` pada `api-read.ts` dan `api-mapper.ts`.
- **`resourceFieldStructureResolution.spec.ts`** — Suite regresi baru yang menguji resolusi field objek & koleksi (`items: object[]` / `OrderDetailResourceTransformed[]`, `promotion: object` (`{ code, discountMinor }`), `gateway: object` (`{ name, orderId, token, redirectUrl }`)) pada artefak `api-read.ts` dan `api-mapper.ts`.
- **`apiReadArtifactGeneration.spec.ts` & `childResourceArrayMapper.spec.ts`** — Suite regresi baru yang menguji secara independen (1) pembentukan artefak interface `types/api-read.ts` (`OrderResourceTransformed`) melalui `TypeScriptGeneratorPass`, serta (2) pemetaan koleksi child resource (`items: api.items ? api.items.map(toOrderDetailResourceRead) : []`) pada `MapperGeneratorPass`.
- **`generatorTypeSafety.spec.ts`** — Regression suite (6 test) yang mengunci behavior runtime di balik fix type-safety `ZodTierGenerator.ts`/`normalizer.ts`: `wrapped:true` detection (lewat `.resolved` dan langsung di `route.response`), nested `kind:'object'` field recursion, parsing raw literal AST node (`{"kind":"literal","code":"..."}`), dan legacy route shape (`uri`/`actionName`/`controllerName`). Mencegah fix compile error di masa depan dikerjakan dengan cara menghapus kode pembaca field, bukan membenarkan type-nya.
- **`resourceAliasDedup.spec.ts` reframing** — `describe` block di-rename dari framing "route" ke "api-contract.ts = registry kontrak backend". Bug A (per-route duplication) digeneralisasi jadi regex per-suffix CRUD (`\w*IndexResponseSchema` dst) alih-alih hardcode nama resource; Bug B (`OrderResponseSchema`, naming branch `count === 1`) dipertahankan sebagai test terpisah karena beda root cause.

### Refactored
- **Flow-Based Type Design & Pure Operations pada `ContractGeneratorPass`** — Memindahkan resolusi dependensi dan fallback ke `createContractGeneratorDependencies` di *Origin Boundary* (`ObjectType.annotations` default `=` tanpa `??` / `||`), mengekstrak `.kind` di Origin Boundary (0% `as` type assertion), mengalokasikan frozen singletons `EMPTY_FIELDS` dan `EMPTY_WARNINGS` (0% alokasi array kosong `[]` redundan), menghapus helper perantara (`extractItemType` & `extractFirstItem`) dan menggantinya dengan pengindeksan array alami `innerResult.fields[0]`, mendefinisikan *Discriminated Union Results* (`SingleResponseFieldResult`, `NullableWrapperResult`, `RequestTypeResponseSchemasResult`), mengekstrak `ResponseData` sebagai antarmuka artefak bernama lintasan domain (`RequestTypesArtifact.ts`), serta mendekomposisi konversi field dan Stage 2 `extractResponseSchemas` ke pure pipeline (`resolveNullableWrapper`, `partitionResults`, `extractRequestTypeResponseSchemas`) tanpa `if`, tanpa `for` loop, tanpa ternary `? :`, tanpa optional chaining `?.`, tanpa `as` type casting, dan tanpa helper indirection. Dikawal oleh 5-layer TDD test suite (54 unit/type tests, 100% GREEN).

### Fixed
- **Eliminasi Objek Kosong `export const *ContractSchema = {};` untuk Resource GET-Only (Issue #28)** — Memperbarui `ContractCodeBuilder.ts` agar menyaring resource yang tidak memiliki request action (`actions.length === 0`), mencegah terbentuknya ekspor objek kosong `{}` pada `api-contract.ts`.
- **Dukungan Tipe Elemen `ObjectType` pada `FormActionGenerator` (Issue #27)** — Memperbarui `FormActionGenerator.ts` agar meng-generate objek array ber-shape inline `{ produkItemId: string; qty: number }` secara rekursif alih-alih tipe generik `object` (`Array<object>`), sehingga tidak ada lagi error TS2339 (`Property 'produkItemId' does not exist on type 'object'`) saat memetakan array items pada `api-mapper.ts`.
- **Koreksi Jalur Import Tipe Form di `MapperGeneratorPass` & `MapperEmitter` (Issue #26)** — Memperbarui `MapperGeneratorPass.ts` dan `MapperEmitter.ts` agar selalu mengimpor tipe form dari `../forms/api-form` (SSOT hasil `FormGeneratorPass`) alih-alih `../types/api-form` (direktori lama yang obsolete), mencegah ketidakcocokan tipe antara `api-mapper.ts` dan `api-form.ts`.
- **Eksklusivitas Mapper Khusus Eloquent JsonResources (Kategori A) & Eliminasi Identity Mapper (Issue #20)** — Memperbarui `MapperGeneratorPass.ts` agar hanya memproses dan menghasilkan read mapper untuk Eloquent JsonResources (`*Resource`), sehingga respons biasa / inline (Kategori B seperti `Profile`, `PaymentWebhook`, `Login`, `Cart`, `Logout`) yang tidak memiliki tipe `*Transformed` tidak lagi menghasilkan identity mapper duplikat (`api-contract` $\rightarrow$ `api-contract`).
- **Pengetikan Strict Parameter Mapper tanpa `any` (Issue #20)** — Menghapus fallback `(api: any)` pada `MapperGeneratorPass.ts` dan menggantinya dengan evaluasi ketat dari `availableContractTypes`. Jika tipe contract belum tersedia, compiler melemparkan error diagnostik ketat alih-alih menyembunyikan masalah dengan `any`.
- **Ekstraksi Resource Reachable Tanpa Endpoint Route (Issue #20)** — Memperbarui `manifestToContractInput` (`manifest-to-types.ts`) agar secara rekursif meng-extract seluruh child resource yang reachable dari graph response (seperti `OrderDetailResource`) meskipun tidak memiliki route top-level tersendiri, sehingga tipe `*ApiResponse` (seperti `OrderDetailResourceApiResponse`) selalu dihasilkan di `api-contract.ts`.
- **Strongly Typed Resource Collection Fields (`items: OrderDetailResourceTransformed[]`) tanpa Fallback ke `unknown` / `object[]`** — Memperbaiki penanganan `resource-flattening.ts` untuk ekspresi `static_method_call` (seperti `OrderDetailResource::collection()`) agar membaca metadata `resolved.resource` & `resolved.collection`. `OrderResourceTransformed` di `api-read.ts` kini bertipe tepat `items: OrderDetailResourceTransformed[]` (bukan fallback ke `unknown` / `object[]`), dan `MapperGeneratorPass.ts` menghasilkan `items: api.items ? api.items.map(toOrderDetailResourceRead) : []` (Issue #19).
- **Preservasi Field Nested Eloquent Resource pada `api-read.ts` & Pencegahan Overwrite Legacy Generator** — `processResources` pada `manifest-to-types.ts` kini mempreservasi struktur nested object pada Eloquent JsonResource (`promotion: object; shipping: object;`) alih-alih me-flatten secara paksa (`promotionCode`, `promotionDiscountMinor`), sehingga tipe `*Transformed` di `api-read.ts` selaras 100% dengan mapping di `api-mapper.ts`. Selain itu, `generate.ts` kini melewati eksekusi legacy `ZodTierGenerator` ketika `CompilerBridge` berhasil dieksekusi agar artefak compiler tidak ter-overwrite (Issue #18).
- **`MapperGeneratorPass` & `api-mapper.ts` Type Import Alignment** — `MapperGeneratorPass` mengimpor `*Form` types (seperti `RegisterForm`, `LoginForm`) dari `'../types/api-form'`, `*ApiResponse` dari `'../contracts/api-contract'`, serta `*Transformed` dari `'../types/api-read'` khusus untuk Eloquent JsonResources. Properti pada mapper inline response dipertahankan sebagai snake_case agar cocok dengan type `*ApiResponse` dari `api-contract.ts`.
- **`LaravelRouteParser` `mergeAssignmentShape` Trailing Comma Clean** — Membersihkan trailing comma pada penulisan array PHP saat menggabungkan `$base` dan `$incrementalAssignments`. Mencegah pembentukan koma ganda (`,,`) pada array literal PHP yang sebelumnya menyebabkan parser memasukkan field numerik palsu `"0": z.unknown()` pada response schema.
- **Model Column Resolution pada `manifest-to-types.ts`** — Mendukung inferensi tipe kolom database model saat `field.kind === 'model'` (misalnya `$categories = Category::get()`), menyelesaikan tipe `id: number`, `nama: string` dari `manifest.models` daripada terdegradasi menjadi `z.unknown()`.
- **`emitters.integration.test.ts` — fix test setup manifest path resolution**: Menggunakan test fixture `createMockManifest()` secara konsisten agar tidak ter-override oleh file `routesync.manifest.json` di root repo yang memiliki struktur rute dan model berbeda.
- **`ZodTierGenerator.ts` — 17 TS compile error** (semua gap deklarasi type untuk field runtime yang sudah lama dipakai, bukan bug logic):
  - `private static graph!: ContractGraph` — TS melarang definite-assignment assertion (`!`) di static class property; diganti `ContractGraph | undefined` (field ternyata write-only).
  - `wrapped?: boolean` ditambahkan ke `ResponseMetadata` (`packages/core/src/types/route.ts`) — field sudah lama di-set `LaravelRouteParser.ts` dan dites di `jsonResourceWrap.spec.ts`, tapi belum pernah dideklarasikan.
  - `code?: string` dan `fields?: Record<string, unknown>` ditambahkan ke `RuntimeAugmented` (`normalizer.ts`) — field raw AST literal node dari PHP extractor.
  - `baseMeta || {}` fallback dihapus (bikin TS infer union yang menyertakan `{}` tanpa properti apa pun).
  - Spread object `respMeta`/`meta` yang menggabungkan field lintas-varian discriminated union `ResponseMetadata` di-type longgar (`Record<string, any>`) karena memang sengaja baca cross-variant.
- **`normalizer.ts` — 11 TS compile error**:
  - 2x `kernel.resolve(ast, context)` di-cast `ast as any` (mengikuti pola "safe boundary cast" yang sudah ada di file yang sama).
  - `Object.values(field.fields).forEach(f => patchField(f as RuntimeAugmented))`.
  - `uri?`, `actionName?`, `controllerName?` ditambahkan sebagai field legacy opsional di `ParsedRoute` — coexist dengan `path`/`action` yang lebih baru (dibuktikan dipakai di fixture `normalizer.spec.ts`, bukan dihapus/diganti seperti percobaan pertama yang sempat bikin regresi 1 test).

### Added
- **Plural Variable Resolution Heuristics** — VariableResolver sekarang memiliki heuristic singularisasi penamaan standard Laravel (misal `$categories` -> `Category`, `$products` -> `Product`). Jika nama variabel plural cocok dengan singular model dari symbolTable, resolver secara otomatis menyelesaikannya sebagai tipe model terkait dengan flag `collection: true`, menghasilkan `z.array(CategorySchema)` secara otomatis.
- **Wrap Detection Regression Test Suite** — Menambahkan uji coba regresi (integration & unit) untuk mendeteksi syntax error, whitespace indentation pada use-statement, fully-qualified class names (FQCN) dengan leading backslash, dan aliased imports (`use X as Y`).
- **`payloadSplit.spec.ts`** — Test suite baru (25 test) memverifikasi pemisahan payload/response: `api-schema.ts` hanya boleh berisi `*PayloadSchema`, `api-contract.ts` hanya boleh berisi `*ResponseSchema`, `SDKGenerator` mengimpor payload validator dari `api-schema`, `HookGenerator` tidak pernah mengimpor `*Payload` dari `api-contract`, dan exported names kedua file sepenuhnya disjoint.

### Changed
- **Pemisahan file kontrak & payload request** — Memindahkan `*PayloadSchema` (seperti `OrderCreatePayloadSchema`), `*Payload` types, dan `validate*Payload` helper functions dari `api-contract.ts` ke `api-schema.ts`. `api-contract.ts` sekarang bersih dari data payload request dan khusus menangani response schema backend (`*ResponseSchema`).

### Fixed
- **Level 90 Eloquent method expansion — `updateOrCreate` dan kawan-kawan** — `LaravelRouteParser` Smart Response Inference sekarang melacak assignment `$var = Model::updateOrCreate(...)`, `firstOrCreate`, `forceCreate`, `make`, `sole`, `firstOrNew`, `newInstance`, `newModelInstance`, dan `updateOrInsert` sebagai single-instance model variable. Sebelumnya, field seperti `$review->title` hasil `updateOrCreate` menghasilkan `z.unknown()` karena method tidak masuk ke regex Level 90 (Issue #16).
- **Assignment scanner — closure `return` false-positive skip** — Scanner tidak lagi membuang assignment yang ekspresinya mengandung kata `return` di dalam nested closure/lambda. Hanya expression yang **diawali** `return` (malformed PHP) yang dilewati. Ini memperbaiki `$review = ProductReview::updateOrCreate(...)` di dalam `DB::transaction(function() { ... })` (Issue #17).
- **`nullsafe_property_access` (`?->`) selalu menghasilkan nullable** — `ExpressionResolver` sekarang memaksa `nullable: true` pada hasil resolusi `nullsafe_property_access` (PHP `?->`) terlepas dari deklarasi nullable kolom di database (Issue #15).
- **Ternary dengan branch `null` menghasilkan nullable** — `ExpressionResolver` sekarang mendeteksi ketika satu branch ternary adalah `null`/`unknown` dan menandai branch yang non-null sebagai `nullable: true` (Issue #14).
- **LaravelRouteParser phpScript Escaping** — Mengamankan runtime template string PHP generator dengan memindahkan script PHP wrap detection ke `String.raw` block untuk mencegah syntax error escaping backslash (Issue #10).
- **Wrap Detection Class Resolvers** — Menghapus namespace hardcoded `App\Http\Resources\` dan menggantinya dengan deterministic FQCN extraction dari return statement dan controller `use` statements. (Issue #11, #12, #13).
- **`JsonResource $wrap` detection** — compiler scanner sekarang mendeteksi apakah
  controller route mengembalikan `new XxxResource(...)` tanpa `$wrap = null`. Kalau
  wrapper `data:` aktif, compiler emit schema dengan `z.object({ data: ... })` wrapper
  yang sesuai. Sebelumnya, schema yang digenerate selalu flat (`OrderResourceSchema`)
  sehingga Zod validation diam-diam gagal saat response backend membungkus data dalam
  `{ data: {...} }` (Laravel `JsonResource` default behavior).

  **Breaking behavior change:** project yang sudah punya `public static $wrap = null`
  tidak terpengaruh. Project yang mengandalkan wrapper `data:` perlu mengupdate
  schema manual atau tambahkan `$wrap = null` di resource class mereka.

### Added
- **`sync` warning untuk `JsonResource` tanpa `$wrap = null`** — saat `routesync sync`
  mendeteksi controller yang return `new XxxResource(...)` dan resource class tidak
  mendeklarasikan `public static $wrap = null`, sebuah warning dicetak ke stderr:
  ```
  ⚠ OrderResource wraps response in { data: ... } but schema expects flat object.
    Add `public static $wrap = null;` to OrderResource, or the generated Zod schema
    will fail at runtime.
  ```
- **README: Development Setup** — menambahkan section baru yang menjelaskan setup
  Next.js `rewrites()` proxy untuk development agar request tidak cross-origin:
  ```ts
  // next.config.ts
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://your-backend.test/api/:path*' },
      { source: '/storage/:path*', destination: 'http://your-backend.test/storage/:path*' },
    ]
  }
  ```
  Dan `.env.local` harus menggunakan relative path:
  ```
  NEXT_PUBLIC_API_URL=/api
  ```
- **Auth-guard page template: `mounted` flag** — generated pages yang membutuhkan
  auth check kini menggunakan pola `mounted` flag untuk menghindari React hydration
  mismatch antara SSR (Zustand store belum ter-hydrate) dan client render:
  ```tsx
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || !isAuthenticated) return <AuthGuard ... />
  ```

## [1.0.49] - 2026-07-08


### Fixed
- **Accessor Type Resolution Pipeline** (Issues #4–#6):
  - **Kernel Graph Sync**: Resolved accessors are now synced back to the kernel's internal model graph after `resolveManifestIncrementally` completes the accessor resolution phase, preventing stale graph data when resolving resource fields.
  - **AccessorResolver Short-Circuit**: `AccessorResolver` now detects already-resolved `expression` objects and returns them directly instead of re-resolving. Added `typeof === 'object'` guard before `in` operator to prevent runtime crash on string values (e.g. `"$this->foo"`).
  - **snake_case → camelCase Fallback**: `ModelColumnResolver` now performs a fallback conversion from snake_case to camelCase when looking up accessors, matching Laravel's convention where accessors are stored as camelCase (`providerTxnId`) but referenced via snake_case (`$this->provider_txn_id`).
  - **Type Safety**: Extended `ModelAccessor` interface with `parsed_ast` and `expression_code` fields. Replaced `any` usage with proper union types and type guards across `AccessorResolver` and `incremental.ts`.

## [1.0.48] - 2026-07-06

### Added
- **Domain-Oriented Intent Patterns (Cart Actions)**:
  - Added support for compiler-generated domain helpers in `hooks.ts` when a group has a `domains` mapping configuration in `routesync.manifest.json`.
  - Automatically generates zero-boilerplate actions such as `.inc(id)`, `.dec(id)`, `.remove(id)`, `.add(id, qty)`, `.applyPromo(code)`, and `.removePromo()`.
- **Global Toast Notifications**:
  - Added a global `toast` config option inside `createClient`. Mutations (create, update, delete) automatically trigger toast callbacks (`toast.success` / `toast.error`) based on action conventions.
- **Unified Query Hook Direct Properties**:
  - React Query hooks now automatically unpack the main data property (matching the resource/group name) alongside query states (`isLoading`, `error`) at the top-level of the returned object (e.g. `const { cart, isLoading } = useCart()`).
  - Supported on both unified group hooks and explicit/canonical query hooks (e.g. `useCart.index()`).
- **Route URL Helper Background Generation**:
  - The URL helper generator output (`routes.ts`) is now written directly into the package dependencies folder and can be imported as `import { routes } from 'routesync/routes'`.
- **Consolidated Constants & Enums**:
  - Created a single source of truth for all generated constants (`API_URL`, `API_ENDPOINTS`, `ROUTES`) and status enums (`Enums`) in a centralized `constants.ts` file, preventing redundancies and desync issues.

### Fixed
- **Rules of Hooks violations**:
  - React Query mutation hooks and `useQueryClient` instances are now strictly invoked at the top-level of React hooks.
- **Strict Type Safety**:
  - Eliminated all instances of `any` from `@routesync/react` runtime libraries.
- **Flattened Relational Property Mapping**:
  - Fixed camelCase flattened properties naming conversions to resolve nested model structures (e.g. `item.produkNama` instead of `item.produk?.nama`).