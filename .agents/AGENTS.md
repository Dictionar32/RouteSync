# RouteSync — Agent Rules & Project Context

Workspace-scoped rules for AI agents working on this repository.

---

## Project Overview

**RouteSync** adalah CLI tool yang melakukan static analysis terhadap project Laravel PHP dan men-generate TypeScript Zod schema + React Query hooks secara otomatis. Pipeline utamanya:

```
Laravel routes/api.php
  └─► LaravelRouteParser (PHP subprocess)
        └─► routesync.manifest.json
              └─► SemanticKernelV2 (TypeScript)
                    ├─► ZodTierGenerator  → api-contract.ts / api-schema.ts
                    └─► HookGenerator     → hooks.ts / sdk.ts
```

### Package Layout

| Package | Path | Deskripsi |
|---|---|---|
| `@routesync/cli` | `packages/cli/` | Scanner PHP, generators, `scan`/`generate`/`sync` commands |
| `@routesync/core` | `packages/core/` | Semantic kernel, resolvers, types |
| `@routesync/sdk` | `packages/sdk/` | Tests, shared utilities |

---

## Rules untuk Agent

### 1. Test Wajib Lulus Sebelum Selesai
Selalu jalankan test suite sebelum mengakhiri sesi:
```bash
cd packages/sdk && npx vitest run --reporter=verbose
```
Target: **semua test lulus**. Jangan tinggalkan test yang failing.

### 2. Setiap Bug Fix → Regression Test
Setiap kali memperbaiki bug, **wajib tambahkan** regression test di `packages/sdk/tests/`. Nama file test harus mencerminkan komponen yang ditest (contoh: `laravelParserAssignments.spec.ts` untuk fix di `LaravelRouteParser`).

### 3. Setiap Issue → Tulis ke KNOWN_ISSUES.md
Format per entry (append, newest first, sebelum issue sebelumnya):
```
### Issue N: <judul singkat>
**Symptom** → ...
**Where** → file path — deskripsi lokasi spesifik
**Root cause** → ...
**Fix** → ...
**Regression test** → <test file> › <test name>
**Status** → Diagnosed & Fixed | Known Limitation | By Design
```

### 4. Setiap Fix → Tambahkan ke CHANGELOG.md
Tambahkan entry di bagian `### Fixed` dalam `## [Unreleased]`. Sertakan referensi `(Issue #N)`.

### 5. Jangan Ubah File PHP yang Di-generate
File `routesync.manifest.json` dan `api-contract.ts`/`api-schema.ts` di project toko-online adalah **output** — jangan diedit langsung. Perbaiki source generator-nya.

### 6. `String.raw` untuk PHP Templates
Semua PHP code block di dalam `LaravelRouteParser.ts` **harus** menggunakan `String.raw\`...\`` agar backslash tidak di-escape JS. Jangan embed PHP langsung di template literal biasa.

### 7. Build Setelah Ubah `packages/core` atau `packages/cli`
`packages/sdk/tests` mengkonsumsi dari `dist/`. Setelah mengubah source core/cli, jalankan:
```bash
npm run build
```
sebelum menjalankan test.

### 8. Flow-Based Structured Code Refactoring Workflow
Saat merapikan/refactor pass atau modul compiler di RouteSync menjadi Structured TypeScript, **wajib** mengikuti 8 langkah eksplisit:
1. **Trace actual flow & origin boundary**: Pindahkan resolusi/komposisi dependensi ke **Origin Boundary** (menggunakan named options object contract + destructuring defaults). Targetnya **bukan sekadar menghilangkan sintaks `??`/`?.` secara dogmatis**, melainkan mengeliminasi kebutuhan *defensive fallback* di downstream code tempat contract-nya seharusnya sudah guaranteed.
2. **Tentukan type family** yang benar-benar muncul dari flow (hindari wrapper buatan yang tidak memberi nilai semantic).
3. **Buat TTD (Type Vocabulary Design) kecil** khusus boundary tersebut tanpa over-engineering struktur folder.
4. **Buat type contract test** untuk `extends` / `implements` / `composition`.
5. **Buat flow test & origin test** untuk jalur data per-stage dan keutuhan dependensi.
6. **Baru refactor implementation** (ubah method `run()` / entry point menjadi *flow declaration* murni yang mengkonsumsi *Complete Contract*).
7. **Jalankan seluruh regression test** yang sudah ada (wajib 100% GREEN).
8. **Bandingkan output sebelum vs sesudah** (pastikan determinisme dan eksaktitas output).

*Catatan*: Test-plan yang ditulis tidak boleh dibuang atau diganti — itu menjadi *baseline behavioral map* untuk refactoring.

### 9. Eksplorasi Flow & Representasi Explicit Model
Gunakan control flow (type guard, branching, ternary) untuk mengeksplorasi behavior yang belum dipahami; setelah struktur domain dan data flow diketahui, representasikan aturan yang stabil sebagai explicit model bila memungkinkan.

### 10. Larangan Interface Parameter Serba Opsional (`?`)
Jika interface parameter dibuat serba opsional (`?`), dampaknya adalah downstream compiler passes dan generators akan terus-menerus dipaksa melakukan defensive guard `if (x)`, fallback `x ?? []`, atau type narrowing berulang-ulang karena datanya tidak pernah dijamin utuh sejak Origin Boundary.
- **Wajib Complete Contract**: Setiap domain descriptor dan parameter constructor harus menuntut kontrak data yang lengkap dan guaranteed non-nullable untuk state yang sudah seharusnya ter-resolve di Origin Boundary.
- **Gunakan Explicit Semantic Factory**: Jika ada variasi state domain (misal objek kosong, rute tanpa validasi, atau pembuatan dari migration schema/path segment), sediakan factory method eksplisit (seperti `.empty()`, `.fromRules()`, `.fromPathSegment()`, `.fromSchema()`), bukan melubangi contract parameter dengan tanda tanya `?`.

### 11. Invariant-Driven / Verified Data Pipeline
Setiap pipeline kompilasi, generator, dan transformasi data di RouteSync **wajib** beroperasi sebagai **Verified Data Pipeline** yang dipandu oleh Single Source of Truth (SSOT) Data Contract:

```
                DATA CONTRACT (SSOT)
                         │
                         ▼
    UPSTREAM ───► VALIDATION ───► DOMAIN ───► LOWERING ───► BOUNDARY
                    │               │
                    │               │
                 reject          transform
                    │               │
                    ▼               ▼
                  ERROR           OUTPUT
```

#### 5 Tahap Wajib Pipeline:
1. **UPSTREAM (Lexing & Extraction)**:
   - Mengekstrak source code PHP Laravel murni (`routes/api.php`, Controllers, FormRequests, Models, JsonResources).
   - Dilarang keras melakukan manipulasi domain, re-inferensi tipe hilir, atau peredaman error di tahap ini.
2. **VALIDATION (Fail-Fast Gatekeeper)**:
   - Memvalidasi integritas data mentah di batas terluar (*boundary check*).
   - Jika payload input rusak, tidak lengkap, atau melanggar skema: **wajib tolak (*reject*) ke ERROR** secara eksplisit.
   - Dilarang membiarkan data cacat mencemari memori domain compiler atau menambalnya dengan fallback diam-diam (*silent fallback*).
3. **DOMAIN (Invariant-Preserving Semantic Models)**:
   - Representasi domain murni berbasis **Complete Data Contract** ([`EndpointContract`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/route.ts#L5957-L5977), 31 ADT Registries, dan `EndpointProvenanceDescriptor`).
   - Setiap entitas domain **wajib beku (*frozen*)** via `Object.freeze()` dengan field non-nullable yang dijamin utuh sejak Origin Boundary.
   - Wajib menyertakan End-to-End Data Provenance (`ProvenanceSourceRef`) yang melacak file, nomor baris, dan simbol asal.
4. **LOWERING (Pure IR Transformation)**:
   - Transformasi dari model domain semantik ke Intermediate Representation (IR Zod, IR TypeScript, QueryKey, Invalidation) **wajib murni menggunakan catamorphism pattern matchers** (`match*` dengan 0 `if`/0 `switch`).
   - Dilarang menebak-nebak tipe dengan regex string atau defensive null checks di tahap transformasi.
5. **BOUNDARY (Verified Emitters & Traceability)**:
   - Generator hilir (`CompilerBridge`, `SDKGenerator`, `HookGenerator`, `ContractCodeBuilder`) murni mengonsumsi data yang sudah tervalidasi dan terjamin dari kontrak SSOT.
   - Wajib menyematkan JSDoc `@provenance` dan `@see` pada setiap artefak kode akhir (`OUTPUT`) untuk menjamin keterlacakan 100% dari TypeScript kembali ke baris file Laravel aslinya.

---

### 12. Correct-by-Construction Architecture (Typed, Contract-Driven, Correct-by-Construction Dataflow)

Saat arsitektur RouteSync naik tingkat melampaui sekadar *Invariant-Driven / Verified Data Pipeline*, fokus bergeser dari:
> *"Apakah setiap tahap benar?"* (Verified)
menjadi:
> *"Bisakah seluruh sistem dibangun sehingga ketidakbenaran tertentu memang tidak mungkin terjadi?"* (Correct-by-Construction)

#### Hierarki Kematangan Arsitektur RouteSync:
```
1. Structured Code
        ↓
2. Typed Data Flow
        ↓
3. Contract-Driven Architecture (CDA)
        ↓
4. Invariant-Driven Pipeline
        ↓
5. Verified Data Pipeline
        ↓
6. Correct-by-Construction  <── [RouteSync Target Standard]
        ↓
7. Proof-Carrying / Formally Verified System
```

#### Perbedaan Konseptual Verified vs Correct-by-Construction:
- **Verified Pipeline**: *"Setelah dibuat, kita periksa apakah benar."* (Input → Transformation → Verification boundary check → Error/Pass).
- **Correct-by-Construction**: *"Strukturnya membuat keadaan salah sulit atau tidak mungkin dibuat sejak hulu."*
  - Constructor setiap varian ADT dan domain descriptor secara ketat menjaga invariant-nya.
  - Downstream compiler passes tidak perlu terus-menerus bertanya defensif:
    ```typescript
    // DILARANG di downstream compiler:
    if (...)
    ?? fallback
    ?. sesuatu
    ```
  - Validity dan keutuhan tipe sudah dibentuk dan dijamin di Origin Boundary.

#### Type-Level Architecture & Data-Flow Graph:
Pindahkan invariant ke dalam Type System:
- **Bukan tipe serba opsional yang memaksa defensive fallback downstream**:
  ```typescript
  type Field = { name?: string; type?: string; }; // BAD: memaksa field.name ?? ...
  ```
- **Melainkan Complete Guaranteed Contract**:
  ```typescript
  type ValidField = { readonly name: FieldName; readonly type: SemanticType; }; // GOOD: guaranteed non-nullable
  ```
- **Type Signature Sebagai Deklarasi Aliran Data (Type-Level Data-Flow Graph)**:
  Interface bukan sekadar daftar method pasif, melainkan deklarasi edge pada graph transformasi data:
  ```
  scan()
    │
    │ RouteManifest
    ▼
  resolve(manifest)
    │
    │ ResolvedSemanticType
    ▼
  lower(type)
    │
    │ TypeScriptContract
    ▼
  emit(contract)
    │
    │ string
    ▼
  Output
  ```
  - **Compiler Sangat Tipis (*Thin Orchestrator*)**:
    ```typescript
    function compile(scanner: Scanner, resolver: Resolver, lowerer: Lowerer, emitter: Emitter): string {
      return emitter.emit(lowerer.lower(resolver.resolve(scanner.scan())));
    }
    ```
  - **Hierarki Konseptual**:
    1. **ADT** $\to$ Mendefinisikan bentuk data (*Domain Shapes*).
    2. **Interface** $\to$ Mendefinisikan boundary + arah transformasi (*Graph Edges*).
    3. **Composition** $\to$ Menyambungkan boundary (*Dataflow Pipeline*).
    4. **Compiler** $\to$ Menjalankan graph (*Thin Runner* tanpa `if`).
    5. **Invariant** $\to$ Menjamin setiap node hanya menerima dan menghasilkan state sah.
  - Jika Tahap A menghasilkan $X$ dan Tahap B membutuhkan $Y$ di mana $X \neq Y$, type system **menolak secara statis saat compile time**.
  *Aksioma*: **Data harus mengalir dari interface ke interface, bukan dicari ulang atau ditebak ulang di setiap layer.**

#### Peta Arsitektur RouteSync:
```
             RouteSync Architecture

                 Domain Model
                      │
                      ▼
                     ADT (32 Registries)
                      │
                      ▼
             Explicit Contracts (SSOT)
                      │
                      ▼
             Invariant-Preserving
                 Transformations (Catamorphisms)
                      │
                      ▼
                 Capabilities
                      │
                      ▼
                  Registry
                      │
                      ▼
                  Compiler (Thin Orchestrator)
                      │
                      ▼
                    Output (Traceable Code)
```

#### Prinsip Inti:
> **"Invalid state should be eliminated at the earliest boundary possible."**
>
> Target akhir pipeline bukan cuma *"pipeline kita selalu diperiksa"*, melainkan:
> **"Pipeline dirancang sedemikian rupa sehingga setiap tahap hanya menerima dan menghasilkan state yang memang sah — flow sudah dipaksa oleh type contract."**
>
> **Bukan:** *"Bagaimana menghilangkan switch?"*  
> **Tetapi:** *"Bagaimana membuat input ke tahap berikutnya sudah cukup terstruktur sehingga tahap tersebut tidak perlu melakukan discovery lagi?"*  
> Itulah pergeseran dari **runtime discovery $\to$ typed dataflow**.
>
> **Keputusan klasifikasi dibuat satu kali di Origin Boundary (`classifyDomainGraph`), hasilnya dibekukan menjadi `ResourceGroupGraph`, dan tahap selanjutnya murni berupa transformasi data bertipe tinggi.**

#### Eliminasi Materialisasi Perantara (Zero Intermediate Staging):
- **"Setiap tahap sebaiknya menghasilkan bentuk data yang memang dibutuhkan tahap berikutnya, bukan menghasilkan collection sementara yang kemudian harus dikumpulkan ulang."**
- **Dua Konsep yang Harus Dipisahkan**:
  1. **Polymorphic Dispatch / ADT Eliminator (`matchFineGrained`, `matchUnified`)**:
     - `Group × Visitor → R`. Beroperasi pada satu item heterogen yang jenis variannya belum di-eliminate.
     - Merupakan *control-flow dispatch* polimorfik, bukan dataflow murni. Berperan murni sebagai *escape hatch* saat berhadapan dengan item individual di luar pipeline utama.
  2. **Partitioned Dataflow (`ResourceGroupGraph`)**:
     - `Origin Boundary → ResourceGroupGraph (fullCrud[], singleton[], custom[]) → Lowerers → Emit`.
     - Data yang masuk sudah menentukan jalurnya. Downstream passes menerima stream data bertipe homogen dan langsung mengalirkannya ke lowerer tanpa conditional branching.
- **Pipelining ke Emitter / Sink vs Intermediate Buffering**:
  - **Anti-Pattern (Unnecessary Intermediate Staging)**: Lowerer menghasilkan `Line[]`, ditampung di `TempArrayA`, di-`concat` / di-`spread` ke `TempArrayB`, lalu baru di-`join`. Terlalu banyak alokasi wadah perantara yang memutus aliran data langsung.
  - **True Dataflow (Direct Pipelining)**: Mengalirkan data langsung ke target Emitter / Sink / Writer (`lowerCrud(group, sink)`), atau mentransformasikan sequence tanpa alokasi wadah perantara.
  - **Final Contract Aggregation**: Penggabungan sah hanya terjadi di boundary terluar jika kontrak artefak domain memang berupa berkas kode tunggal (`string` / file artifact).

---

## Pola Bug yang Sering Muncul

### Pattern A: `z.unknown()` pada field yang seharusnya typed
**Kemungkinan penyebab (cek berurutan):**
1. Method Eloquent tidak ada di Level 90/80 regex → tambahkan ke alternation di `LaravelRouteParser.ts`
2. Variabel plural tidak bisa di-resolve ke model → cek `VariableResolver.ts` heuristic
3. Accessor di model tidak ter-resolve → cek `AccessorResolver.ts` early-return guard
4. Kolom `nullable: true` tapi bukan dari `?->` → cek `ExpressionResolver.ts` nullsafe handler
5. Assignment di dalam closure discarded → cek `assignmentsScannerPhp` skip guard

### Pattern B: Schema field wrapped/unwrapped salah
**Kemungkinan penyebab:**
1. `JsonResource` pakai default `$wrap = 'data'` → cek `wrapDetectionPhp` di `LaravelRouteParser.ts`
2. `use X as Y` alias tidak ter-resolve → cek regex alias di wrap detection block

### Pattern C: Test PHP integration gagal
**Kemungkinan penyebab:**
1. Build belum dijalankan setelah ubah source → `npm run build`
2. Backslash escape salah di PHP template → pakai `String.raw`

---

## Known Issues Ringkasan

| # | Judul | Status |
|---|---|---|
| 17 | Assignment scanner skip closure-return false positive | ✅ Fixed |
| 16 | `updateOrCreate` tidak tracked di Level 90 | ✅ Fixed |
| 15 | `?->` tidak menghasilkan nullable | ✅ Fixed |
| 14 | Ternary branch `null` tidak nullable | ✅ Fixed |
| 13 | `use X as Y` alias tidak resolve di wrap detection | ✅ Fixed |
| 12 | Indented `use` statement tidak match | ✅ Fixed |
| 11 | Hardcoded `App\Http\Resources\` namespace | ✅ Fixed |
| 10 | TS→PHP template escaping syntax error | ✅ Fixed |
| 9 | JSON member access chain — runtime typing | ⚠ Partial (by design) |
| 8 | JSON/array cast `unknown` on property access | ⚠ Known Limitation |
| 7 | Chained access through nonexistent relation | ✅ By Design |
| 6 | snake_case → camelCase accessor mismatch | ✅ Fixed |
| 5 | AccessorResolver treated resolved result as raw AST | ✅ Fixed |
| 4 | Kernel model graph stale after accessor resolution | ✅ Fixed |
| 3 | Route parameter type mismatch (undefined vs number) | ✅ Fixed |
| 2 | Request payload form type mismatch (number vs string) | ✅ Fixed |
| 1 | DB connection refused in Docker | ✅ Workaround |

Detail lengkap → [`KNOWN_ISSUES.md`](../KNOWN_ISSUES.md)
