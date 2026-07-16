# Changelog

All notable changes to RouteSync will be documented in this file.

## [Unreleased]

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
