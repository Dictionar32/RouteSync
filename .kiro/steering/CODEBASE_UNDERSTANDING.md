# PEMAHAMAN ARSITEKTUR ROUTESYNC CODE GENERATOR

> Dokumentasi untuk pemahaman mendalam codebase generator pipeline RouteSync.
> Berdasarkan analisis Engine.FIx.md + eksplorasi code direktnya.

## BAGIAN 1: STRUKTUR GENERATOR PIPELINE

### 1.1 Alur Data Keseluruhan

```
Laravel (PHP Runtime)
    ↓
LaravelRouteParser (scanning reflection-based)
    ↓
routesync.manifest.json
    ├── routes[] (ParsedRoute)
    ├── models[] (ParsedModel)
    └── resources[] (ParsedResource)
    ↓
generate.ts (command entry)
    ├── normalizeManifest(manifest, kernel)  → NormalizedManifest
    │   [Dijalankan tapi DIBUANG — tidak di-pass ke generator]
    │
    └── 11 generator independen
        ├── TypeGenerator → types/index.ts
        ├── SDKGenerator → api.ts
        ├── HookGenerator → hooks.ts
        ├── QueryKeyGenerator → query-key.ts
        ├── ConstantsGenerator → constants.ts
        ├── ModelGenerator → models.ts
        └── ZodTierGenerator → 6 files
            ├── generateContract() → contract/api-contract.ts
            ├── generateSchema() → contract/api-schema.ts
            ├── generateField() → contract/api-field.ts
            ├── generateRead() → types/api-read.ts
            ├── generateForm() → types/api-form.ts
            └── generateMapper() → mappers/api-mapper.ts
```

**Insight kunci:** `normalizeManifest()` menghasilkan IR (Intermediate Representation) yang lengkap 
tapi tidak dikonsumsi. Semua generator masih menerima `RouteManifest` mentah dan re-infer.

### 1.2 ZodTierGenerator: God Object dengan 6 Tanggung Jawab

```
ZodTierGenerator.ts (1890 baris, 83KB)
├── private static knownSchemas: Set<string>    ← MUTABLE CLASS-STATIC STATE
├── private static graph: ContractGraph         ← DEAD FIELD (tidak dipakai)
│
└── static generate(manifest)
    ├─ knownSchemas.clear()  [reset untuk run baru]
    ├─ graph = new ContractGraph(manifest)
    ├─ Populate knownSchemas dengan model/resource names
    │
    ├─→ generateContract()
    │   ├─ Emit: Model/Resource schemas (snake_case)
    │   ├─ Emit: Route-named schemas (fallback)
    │   └─ RETURN: routeResponseMap (Map<string, RouteResponseComposition>)
    │
    ├─→ generateSchema()  [TIDAK baca routeResponseMap — re-infer dari nol]
    │   └─ Emit: Form validation schemas
    │
    ├─→ generateField()   [TIDAK baca routeResponseMap]
    │   └─ Emit: camelCase ↔ snake_case lookup table
    │
    ├─→ generateRead()    [BACA routeResponseMap sebagai parameter ✓]
    │   ├─ Re-infer SQL types → TS types
    │   └─ Emit: ${Model}Transformed types (camelCase)
    │
    ├─→ generateForm()    [TIDAK baca routeResponseMap]
    │   └─ Emit: Form request schemas
    │
    └─→ generateMapper()  [BACA routeResponseMap sebagai parameter ✓]
        └─ Emit: Transform functions (runtime mappers)
```

**Problem:** Hanya `generateRead()` dan `generateMapper()` yang menerima IR 
(`routeResponseMap`). Yang lain re-infer dari nol. IR juga tidak pernah di-export 
ke generator lain (HookGenerator, SDKGenerator).

## BAGIAN 2: MUTABLE STATE & TEMPORAL COUPLING

### 2.1 knownSchemas: Class-Static Mutable

```typescript
class ZodTierGenerator {
  private static knownSchemas = new Set<string>()  // ← Persists across calls!
  
  static generate(manifest) {
    this.knownSchemas.clear()  // Must be called FIRST!
    // ... populate ...
    this.generateContract()    // Assumes knownSchemas populated
  }
}
```

**Temporal Coupling Risk:**
- Kalau `generateContract()` dipanggil direktly (dari test/debug) tanpa `generate()` dulu
- `knownSchemas` berisi sisa dari run sebelumnya
- Menghasilkan output yang silent wrong
- TypeScript tidak akan ketangkap

### 2.2 routeResponseMap: Lokal tapi Scope Terbatas

```
Hidup di stack `generate()`:
├─ Dibuat di generateContract()
├─ Di-pass explicit ke generateRead() & generateMapper() ✓
└─ BERHENTI DI SINI — tidak di-export/di-return

SDKGenerator.generate() — tidak terima routeResponseMap
├─ Baca RouteManifest mentah
├─ Re-infer getResponseInfo() sendiri
└─ Bisa divergen dari ZodTierGenerator.routeResponseMap
```

## BAGIAN 3: DUPLIKASI MASIF

### 3.1 ACTION_MAP: Ada di 6 Tempat

```typescript
// ZodTierGenerator.ts
const CONTRACT_ACTION_MAP = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }
const SCHEMA_ACTION_MAP = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }
const MAPPER_ACTION_MAP = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }

// HookGenerator.ts
const ACTION_TO_CRUD_HOOK = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }

// SDKGenerator.ts
const SDK_ACTION_MAP = { post: 'Create', put: 'Update', patch: 'Update', delete: 'Delete' }
```

**Problem:** Isi identik tapi ada di 6 tempat. Kalau format berubah, update manual di 6 tempat.

### 3.2 Resource/Model Resolution: 3 Implementasi Independen

Keputusan "response ini resource yang sudah ada, atau fallback ke model?" 
dihitung ulang di:
1. `ZodTierGenerator.generateContract()` → `isResourceAlias` logic
2. `HookGenerator.resolveBaseResponseName()` → implementasi sendiri
3. `HookGenerator.resolveResponseInfo()` → implementasi ketiga
4. `SDKGenerator.getResponseInfo()` → implementasi keempat

**Hasil:** Bisa silent diverge tanpa compiler yang ketangkap.

### 3.3 Type Inference: Sistem Paralel (Zod vs TS)

```typescript
// Sistem #1: buildResponseZodType()
private static buildResponseZodType(response, kernel, context) {
  if (type === 'number') return 'z.number()'
  if (type === 'string') return 'z.string()'
  // ... lebih banyak logic ...
}

// Sistem #2: mapSqlTypeToTs() [di generateRead()]
private static mapSqlTypeToTs(sqlType) {
  if (type.includes('int')) return 'number'
  if (type.includes('varchar')) return 'string'
  // ... IDENTIK STRUKTUR, cuma output syntax beda ...
}
```

**Problem:** Kalau ada SQL type baru (misal `year`):
- Add ke `mapSqlTypeToZod()` → Zod schema bekerja
- LUPA add ke `mapSqlTypeToTs()` → TS type salah
- **TypeScript tidak ketangkap** karena dua sistem independent

### 3.4 Manifest Traversal: Duplikasi

```typescript
// generateContract() baris 294
const contractResponseCount = new Map()
for (const route of routes) {
  if (route.response) {
    const r = route.groupName || deriveGroupName(route.path)
    contractResponseCount.set(r, (contractResponseCount.get(r) || 0) + 1)
  }
}

// generateMapper() baris 1207 — SAMA PERSIS
const mapperAllRespCount = new Map()
for (const route of routes) {
  if (route.response) {
    const r = route.groupName || deriveGroupName(route.path)
    mapperAllRespCount.set(r, (mapperAllRespCount.get(r) || 0) + 1)
  }
}
```

Traversal yang sama, dijalankan 2x independen. Harus di-compute sekali, di-cache.

## BAGIAN 4: MISSING IR (Intermediate Representation)

### 4.1 IR yang Ada Tapi Tidak Digunakan

```typescript
// generate.ts line 47-50
const kernel = new SemanticResolutionKernel()
const normalizedManifest = normalizeManifest(manifest, kernel)
                              ↑
                  [Ditampung di variable, tapi TIDAK DIPAKAI]

// Seharusnya:
await SDKGenerator.generate(normalizedManifest)

// Kenyataan:
await SDKGenerator.generate(manifest)  // Raw manifest!
```

`normalizeManifest()` menghasilkan lengkap:
```typescript
interface NormalizedManifest {
  routes: NormalizedRoute[]       // Dengan resolved types
  models: NormalizedModel[]       // Dengan normalized fields
  resources: NormalizedResource[] // Dengan normalized fields
}

// Setiap route punya:
response: NormalizedField  // Union: Primitive | Object | Model | Resource
  └─ kind: 'primitive' | 'object' | 'model' | 'resource'
  └─ nullable: boolean
  └─ collection: boolean (untuk model/resource)
  └─ paginated: boolean (untuk model/resource)
```

**Insight:** Semua keputusan tipe **sudah** di-resolve, tapi generator tidak membacanya.

### 4.2 routeResponseMap: Private IR

Satu-satunya IR yang dipakai di pipeline:
```typescript
interface RouteResponseComposition {
  zType: string              // Zod expression
  tsType: string             // TS type expression
  isCollection: boolean
  isPaginated: boolean
  isWrapped: boolean
  isResourceAlias: boolean
  name?: string              // Exported name kalau bukan alias
}

// Dihasilkan: ZodTierGenerator.generateContract()
// Dikonsumsi: ZodTierGenerator.generateRead() & generateMapper() SAJA
// TIDAK dikonsumsi: SDKGenerator, HookGenerator, QueryKeyGenerator
```

**Problem:** IR ini bekerja dengan baik **dalam** ZodTierGenerator, 
tapi tidak pernah dibagikan.

## BAGIAN 5: COMPILER PASSES (SUDAH ADA, TAPI DIBUANG)

```
normalizer.ts → normalizeManifest(manifest, kernel)
├─ Pass 1: ModelGraphBuilderPass
│  └─ Build dependency graph model ↔ resource
├─ Pass 2: SemanticResolutionPass
│  └─ Resolve type references (model names, resource fields)
├─ Pass 3: NormalizationPass
│  └─ Convert ke NormalizedRoute/Model/Resource
└─ Pass 4: ValidationPass
   └─ Validate completeness

Result: NormalizedManifest (lengkap dengan resolved types)
        ↓
        [DIBUANG — tidak di-pass ke generator]
```

**Missed opportunity:** IR ini bisa jadi single source of truth untuk semua generator.

## BAGIAN 6: DEPENDENCIES ANTAR GENERATOR

| Generator | Input | Baca dari generator lain? | Problem |
|-----------|-------|--------------------------|---------|
| ZodTierGenerator | RouteManifest | TIDAK | Re-infer dalam method 6x |
| HookGenerator | RouteManifest | TIDAK | Re-infer resource/model |
| SDKGenerator | RouteManifest | ConstantsGenerator saja | Re-infer response type |
| TypeGenerator | RouteManifest | TIDAK | Simple barrel re-export |
| Others | RouteManifest | Minimal | OK |

**Pattern:** Tidak ada dependency eksplisit berdasarkan IR — semua berdasarkan 
implicit contract by naming convention.

---

**Lanjut di Part 7 & 8...**


## BAGIAN 7: KEPUTUSAN COMPILER vs RENDERING

### 7.1 Yang Seharusnya Terjadi (Ideal)

```
Manifest mentah
    ↓
Compiler Pass (sekali saja)
├─ Keputusan 1: Response adalah Resource yang ada, atau fallback ke Model?
├─ Keputusan 2: SQL type 'int' → apa di Zod, apa di TS?
├─ Keputusan 3: Apakah field nullable, collection, paginated?
└─ Result: Immutable IR dengan semua keputusan sudah final
    ↓
IR (single source of truth)
    ├─→ Zod Renderer   (baca IR, emit z.number(), z.string(), etc)
    ├─→ TS Renderer    (baca IR, emit number, string, etc)
    ├─→ Mapper Renderer (baca IR, emit transform functions)
    └─→ Hook Renderer  (baca IR, emit React Query hooks)
```

**Keuntungan:**
- Setiap keputusan dihitung 1x, di-cache di IR
- Semua renderer melihat keputusan yang sama
- Kalau logic berubah, update di IR pass, semua renderer otomatis benar
- Type-safe by construction

### 7.2 Kenyataan Sekarang

```
Manifest mentah
    ↓
(partial IR computed, dibuang)
    ↓
11 generator independen
├─→ ZodTierGenerator re-infer 6x di method-nya sendiri
├─→ HookGenerator re-infer resource/model di method sendiri (2 implementasi)
├─→ SDKGenerator re-infer response type di method sendiri
└─→ Others re-infer masing-masing
    ↓
11 output files (bisa silent diverge antar-keputusan yang sama)
```

**Risiko:**
- Setiap keputusan dihitung multiple kali di tempat berbeda
- Bisa diverge tanpa compiler yang ketangkap
- Root cause dari bug alias schema yang sudah pernah diperbaiki

## BAGIAN 8: IMPLICIT CONTRACTS BY CONVENTION

Tidak ada compiler check untuk:

1. **Response naming:**
   - ZodTierGenerator emit `${respName}ResponseSchema`
   - SDKGenerator assume nama itu ada dan matchable
   - Kalau ZodTierGenerator emit logic berubah → SDKGenerator implicit import fail

2. **Mapper naming:**
   - ZodTierGenerator emit `to${baseModel}Read`
   - HookGenerator assume mapper dengan nama itu ada
   - Silent fail kalau nama tidak match

3. **ACTION_MAP consistency:**
   - 6 ACTION_MAP literal identik
   - Kalau salah satu update lupa → inconsistency
   - Bukan type error, bukan runtime error, bukan compiler warning
   - Hanya bug kalau ada test yang explicit

4. **Type inference logic:**
   - `mapSqlTypeToZod()` dan `mapSqlTypeToTs()` identik struktur
   - Tapi independent — tidak di-share
   - Kalau ada SQL type baru di salah satu → keduanya bisa diverge

## BAGIAN 9: SCALABILITY IMPACT

### 9.1 Computational Complexity

Per 2000 routes + 500 models:

```
ACTION_MAP lookup × 6 tempat × 2000 routes = 12,000 duplicate lookups
camelCase() call × 22 lokasi = 44,000+ transformasi independen
Manifest traversal × 2 (contract + mapper count) = 2x kerja duplikasi
Resource/model resolution × 3-4 lokasi = triple keputusan yang sama
```

**Performa:** Masih OK (string ops murah), tapi constant-factor multiplier besar.

### 9.2 Maintenance Burden

Kalau logic berubah (misal, "post→Create" jadi "post→Build"):
- Update `CONTRACT_ACTION_MAP` ← ✓ di satu tempat
- Update `SCHEMA_ACTION_MAP` ← LUPA, bug!
- Update `MAPPER_ACTION_MAP` ← LUPA, bug!
- Update `SDK_ACTION_MAP` ← LUPA, bug!
- Update `ACTION_TO_CRUD_HOOK` (×2 di HookGenerator) ← LUPA, bug!
- Total: 5 tempat untuk di-lupa, ~1-2 bug yang silent (tidak ada compiler error)

### 9.3 Incremental Compilation

`ZodTierGenerator.generate()` selalu regenerate 6 file penuh dari nol:
```typescript
this.knownSchemas.clear()  // Reset everything
```

Tidak ada caching berbasis per-route/per-resource. Di 2000 routes, 
setiap `routesync sync` adalah full rebuild.

## BAGIAN 10: KEPUTUSAN-KEPUTUSAN YANG HARUS DIHITUNG

| Keputusan | Saat Ini Dihitung | Seharusnya Dihitung |
|-----------|-------------------|-------------------|
| Response = resource apa atau model apa? | 3-4 tempat independent | 1x di compiler pass |
| SQL type → Zod type → TS type | Parallel di 2 method | 1x di compiler, 2x render |
| Action post → Create? | 6 tempat | 1x di IR (const) |
| Field → camelCase transform? | generateRead + consumers | 1x di IR |
| Routes per resource count? | contractResponseCount + mapperCount | 1x di IR |
| Nullable? Collection? Paginated? | Per-method inference | 1x di NormalizedRoute |
| Wrapped behavior? | 3 tempat check | 1x di IR |

---

## BAGIAN 11: MANIFEST FLOW — DETAIL TEKNIS

### 11.1 ParsedRoute (dari PHP Scanner)

```typescript
interface ParsedRoute {
  name: string
  method: string           // 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
  path: string
  actionName: string       // 'show', 'store', 'update', 'destroy', etc
  controllerName: string
  response: RuntimeAugmented {
    type?: string          // 'model', 'resource', 'collection', 'object'
    kind?: string
    model?: string
    resource?: string
    collection?: boolean
    paginated?: boolean
    wrapped?: boolean      // JsonResource $wrap behavior
    fields?: Record<string, any>
    resolved?: SemanticNode
    semantic?: SemanticNode
  }
  schema?: { rules: Record<string, any> }
}
```

### 11.2 NormalizedRoute (dari Compiler Pass)

```typescript
interface NormalizedRoute {
  symbolId: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  uri: string
  actionName: string
  controllerName: string
  response: NormalizedField  // ← FULLY RESOLVED
}

// NormalizedField adalah union type:
type NormalizedField = 
  | PrimitiveField { kind: 'primitive', type: 'string'|'number'|'boolean'|'null'|'any', nullable }
  | ObjectField { kind: 'object', fields: Record<string, NormalizedField>, nullable }
  | ModelField { kind: 'model', modelName: string, collection, paginated, nullable }
  | ResourceField { kind: 'resource', resourceName: string, collection, paginated, nullable }
```

**Perbedaan:**
- `ParsedRoute.response` = metadata raw dari PHP scanner (bisa partial/uncertain)
- `NormalizedRoute.response` = keputusan final, fully resolved, immutable

### 11.3 Gap di generate.ts

```typescript
// Line 47-50
const kernel = new SemanticResolutionKernel()
const normalizedManifest = normalizeManifest(manifest, kernel)  // ← Generated!

// Line 60+
await SDKGenerator.generate(manifest)  // ← Menerima ParsedRoute, bukan NormalizedRoute!

// Seharusnya:
await SDKGenerator.generate(normalizedManifest)
```

---

## BAGIAN 12: FILE STRUCTURE GENERATOR OUTPUT

Saat `--zod` flag aktif, struktur output:

```
src/api/
├── contract/
│   ├── api-contract.ts          ← ZodTierGenerator.generateContract()
│   ├── api-schema.ts            ← ZodTierGenerator.generateSchema()
│   └── api-field.ts             ← ZodTierGenerator.generateField()
├── types/
│   ├── index.ts                 ← TypeGenerator
│   ├── api-read.ts              ← ZodTierGenerator.generateRead()
│   └── api-form.ts              ← ZodTierGenerator.generateForm()
├── mappers/
│   └── api-mapper.ts            ← ZodTierGenerator.generateMapper()
├── api.ts                        ← SDKGenerator
├── hooks.ts                      ← HookGenerator (if --hooks)
├── query-key.ts                 ← QueryKeyGenerator (if --hooks)
└── constants.ts                 ← ConstantsGenerator
```

### 12.1 Siapa Generate Apa (di ZodTierGenerator)

**generateContract():** Backend contract layer (snake_case)
- Emit: `${model}Schema`, `${resource}Schema` untuk setiap model/resource
- Emit: `${respName}ResponseSchema` untuk route yang bukan resource alias
- Emit: Zod validators `validate${name}Response`
- Return: `routeResponseMap` (IR lokal)

**generateSchema():** Form validation layer
- Baca: `RouteManifest` mentah
- Emit: `${action}Payload` schemas untuk form submission validation
- Emit: `zodResolver` configuration

**generateField():** Field mapping layer
- Baca: `RouteManifest` mentah
- Emit: Static mapping `ApiField = { USER_NAME: 'user_name', ... }`
- Purpose: Frontend form field transformation reference

**generateRead():** Read model layer (camelCase)
- Baca: `routeResponseMap` (IR dari generateContract), RouteManifest
- Emit: `${model}Transformed` types (read-only, camelCase)
- Re-infer: SQL type → TS type (duplikasi dari buildResponseZodType)

**generateForm():** Form model layer
- Baca: `RouteManifest` mentah
- Emit: `${group}Form` type (form request shapes)
- Purpose: Type-safe form submission

**generateMapper():** Transform function layer
- Baca: `routeResponseMap` (IR dari generateContract), RouteManifest
- Emit: `to${name}Read`, `to${name}ReadList` functions
- Purpose: Runtime transformation (snake_case → camelCase)

---

## BAGIAN 13: NEXT STEPS UNTUK MEMAHAMI LEBIH DALAM

### 13.1 Baca File-File Ini Secara Detail:

**Tier 1 (Fundamentals):**
```
packages/cli/src/generators/
├── names.ts                    (150 baris) — Naming utilities
├── route-classifier.ts         (200 baris) — Path → group derivation
└── normalizer.ts               (500 baris) — IR definitions
```

**Tier 2 (Pipeline):**
```
packages/cli/src/generators/
├── pipeline.ts                 (70 baris) — Compiler framework
├── passes.ts                   (200 baris) — 4 compiler passes
```

**Tier 3 (Core Generator):**
```
packages/cli/src/generators/
└── ZodTierGenerator.ts         (1890 baris) — God Object terbesar
```

**Tier 4 (Dependent Generators):**
```
packages/cli/src/generators/
├── HookGenerator.ts            (400 baris) — re-infer 2x
├── SDKGenerator.ts             (400 baris) — re-infer getResponseInfo
└── TypeGenerator.ts            (50 baris)  — simple barrel export
```

### 13.2 Debugging Tips:

**Tracking resource/model resolution:**
```typescript
// Set breakpoint di ZodTierGenerator.generateContract() line 376
const isResourceAlias = ...  // Keputusan pertama di sini

// Trace ke HookGenerator.resolveBaseResponseName() 
// Compare logic — apakah sama hasil?
```

**Tracking type inference:**
```typescript
// Set breakpoint di ZodTierGenerator.buildResponseZodType()
// Lihat apa yang dihasilkan untuk setiap route

// Set breakpoint di generateRead() mapSqlTypeToTs()
// Compare output — apakah match dengan Zod?
```

**Tracking duplicate traversal:**
```typescript
// Add console.log di contractResponseCount loop (line 294)
// Add console.log di mapperAllRespCount loop (line 1207)
// Compare counts — apakah identik?
```

### 13.3 Questions untuk Self-Exploration:

1. Di mana `knownSchemas` di-clear dan di-populate?
2. Apakah `generateContract()` bisa dipanggil tanpa `generate()` dulu?
3. Di mana `routeResponseMap` di-populate, dan siapa yang membacanya?
4. Apakah `normalizeManifest()` result pernah dikonsumsi?
5. Bagaimana cara HookGenerator menentukan resource name untuk route tertentu?
6. Apakah SDKGenerator dan HookGenerator pernah koordinasi tentang response type?
7. Di mana ACTION_MAP didefinisikan, dan berapa jumlahnya?

---

## RINGKASAN PEMAHAMAN ARSITEKTUR

**Struktur Sekarang:**
- 11 generator independen, masing-masing baca RouteManifest mentah
- ZodTierGenerator dengan 6 tanggung jawab (method) dalam 1 class
- IR ada (`NormalizedManifest`) tapi tidak digunakan
- IR lokal (`routeResponseMap`) hanya dipakai internal ZodTierGenerator

**Masalah Arsitektur:**
- Keputusan compiler re-derived 3-6 tempat independen
- Bisa silent diverge tanpa compiler warning
- Mutable state (`knownSchemas`) dengan temporal coupling risk
- Implicit contract by naming convention, bukan explicit IR

**Peluang Improvement:**
1. Gunakan `NormalizedManifest` (sudah ada, tinggal di-pass)
2. Export `routeResponseMap` ke generator lain
3. Centralize `ACTION_MAP` jadi 1 const di `names.ts`
4. Unify type inference (Zod vs TS) ke 1 sistem
5. Split ZodTierGenerator jadi module-module terpisah
6. Buat compiler IR yang comprehensive dan immutable

---

**Dokumen ini adalah guide untuk memahami arsitektur saat ini. 
Gunakan untuk:**
- Understand flow data dan dependencies
- Identify duplication dan coupling
- Plan refactoring tanpa breaking changes
- Debug issues berdasarkan understanding yang jelas
