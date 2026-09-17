# RouteSync — Agent Rules & Project Context

Workspace-scoped rules for AI agents working on this repository.

---

## Project Overview

**RouteSync** adalah CLI tool yang melakukan static analysis terhadap project Laravel PHP dan men-generate TypeScript Zod schema + React Query hooks secara otomatis. Pipeline utamanya:

```
Laravel routes/api.php, Controllers, Models, FormRequests
  └─► StaticLaravelScanner (TypeScript AST / 0 PHP subprocess)
        └─► routesync.manifest.json
              └─► CompilerBridge / SemanticKernelV2 (TypeScript IR)
                    ├─► ContractGeneratorPass   → contract/api-contract.ts / api-schema.ts
                    ├─► TypeScriptGeneratorPass → types/api-read.ts / forms/api-form.ts
                    └─► HookGenerator           → hooks.ts / api.ts
```

### Package Layout

| Package | Path | Deskripsi |
|---|---|---|
| `@routesync/cli` | `packages/cli/` | Generators, emitters, command CLI (`scan`/`generate`/`sync`/`audit`/`watch`) |
| `@routesync/core` | `packages/core/` | `StaticLaravelScanner` (Upstream Lexer), semantic kernel, resolvers, types |
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
Setiap kali memperbaiki bug, **wajib tambahkan** regression test di `packages/sdk/tests/`. Nama file test harus mencerminkan komponen yang ditest (contoh: `staticLaravelScannerUpstream.spec.ts` untuk scanner atau `accessorResolver.spec.ts` untuk resolver).

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

### 6. Zero PHP Subprocess & Pure TypeScript AST
Semua parsing route, model, controller, dan FormRequest **harus** melalui `StaticLaravelScanner` / `LaravelSourceLexer` murni TypeScript (0 PHP subprocess). Dilarang mengeksekusi subprocess `php -r` atau PHP reflection runtime di pipeline produksi.

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
- **Prinsip Inti CDA vs Anti-Pattern**: **Seharusnya data dibentuk dan divalidasi oleh First-Class Domain Models di Origin Boundary, bukan dikumpulkan lewat parameter serba opsional lalu ditebak-tebak di dalam descriptor.**
  - *Anti-Pattern (Kebalikan dari CDA)*: `create()` menerima parameter bag 28-field serba opsional (`?:`), lalu descriptor melakukan procedural string hacking (5 `if` membedah `@`, 7 `if` menebak domain, regex + 5 ternary menebak CRUD role, loop rules menebak multipart vs json), dan baru di baris terakhir dibungkus ke sub-contracts.
  - *Correct Pattern (CDA & Correct-by-Construction)*: Data dibentuk oleh First-Class Domain Models di Origin Boundary (controller di-parse di Lexer, domain di-resolve oleh `RouteDomainResolver`, CRUD role oleh `RouteCrudClassifier`), dan descriptor `create()` murni mengonsumsi 4 Complete Sub-Contracts (`identity`, `binding`, `capability`, `provenance`) dengan **0 `?:`, 0 `if`, 0 `??`, 0 `?.`**.

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

#### Pure Dataflow Standard (Single Stream, Single Pass, Zero Branching):
- **Aksioma: "Kalo ada `if`, data flow belum lengkap"**:
  - Munculnya kondisional branching (`if`, `switch`, atau ternary penyelidik jenis) di hilir (downstream compiler passes, generator, lowerer) adalah tanda cacat arsitektur: data yang dialirkan ke tahap tersebut belum cukup terstruktur atau belum membawa kapabilitas yang utuh sejak Origin Boundary.
  - Aliran data murni tidak bertanya *"Kamu ini jenis apa?"* di tengah jalan, melainkan setiap item sudah terpolarisasi atau membawa kapabilitas mandiri untuk memproyeksikan dirinya ke tahap berikutnya.
- **Aksioma: "Banyak `for` berurutan sama saja dengan `if`"**:
  - Mengurai satu koleksi domain menjadi serangkaian loop imperatif terpisah (`for (const c of crud) ...`, `for (const s of singleton) ...`, `for (const u of custom) ...`) hanyalah branching yang dibuka kedoknya (*unrolled control-flow branching*).
  - Anti-pattern ini merusak kohesi dan urutan domain alami (*natural domain ordering*), serta memicu perulangan parsial yang rentan *state leakage*.
- **Persamaan Dataflow Murni (The Single Pipeline Equation)**:
  $$\text{Stream}(\text{Domain}) \xrightarrow{\text{yield* } x.\text{lower}()} \text{Stream}(\text{Output Lines}) \xrightarrow{\text{write}()} \text{File}$$
  Standar emas transformasi hilir adalah:
  **1 Stream, 1 Pass (`for`), 0 `if`, 0 `switch`, 0 multiple `for`**.
  ```typescript
  // Target Pure Dataflow di Generator/Emitter:
  for (const group of groups) {
    yield* group.lowerHookConfig(); // group memegang self-projecting capability
  }
  ```
- **Pemberian Makna pada `yield*` vs `const`**:
  - `const`: Digunakan untuk *domain snapshots* atau state konseptual yang bermakna, deterministik, dan immutable (misalnya kontrak, opsi, konfigurasi).
  - `yield*`: Digunakan untuk *stream delegation* langsung antar-generator tanpa mengalokasikan wadah/buffer perantara ("ember penampung sementara"). Mengalirkan data dari pipa ke pipa langsung ke Emitter / Sink.

---

### 13. Direct Prompt Output Standard (Zero Redundant Preamble & Rule-Solution Pairing)
Saat user meminta untuk membuat prompt perbaikan atau refactoring:
- **Dilarang menyajikan penjelasan berulang** (*zero repetitive preamble / conversational meta-chatter*) baik sebelum maupun sesudah blok prompt.
- **Wajib langsung menyajikan prompt siap-eksekusi** yang terstruktur, tajam, dan memuat 2 opsi akar masalah (Upstream vs Downstream), strategi perbaikan berbasis Type Vocabulary Design (TTD), constructor kuat (0 `?`), mitigasi risiko fatal, dan verifikasi test.
- **Wajib Rule & Solution Pairing (Product & Tool Design Engineering)**: Setiap larangan (seperti larangan naked `Record`, larangan fake wrapper, larangan sentinel `null`) WAJIB dipasangkan dengan solusi arsitektural level tinggi yang konkret (First-Class Domain Specifications, Symbol Tables, Discriminated AST Variants, dan Isolated Boundary Adapters).

---

### 14. Orchestrator Sebagai Active Consumer (Zero Wildcard Re-export, Pure Flow Declaration)
> **"Orchestrator adalah Active Consumer: mengimpor fungsi/spesifikasi dari sub-domain, lalu menggunakannya untuk menjalankan tugas utamanya."**
>
> - **Dilarang Menjadi Barrel Pasif**: Orchestrator bukan sekadar tempat `export * from` yang hanya melempar simbol tanpa peran komputasi.
> - **Active Consumption**: Mengimpor modul-modul sub-domain terfokus (~100 baris per file) dan merakitnya menjadi alur eksekusi konkret.
> - **Pure Flow Declaration**: Badan method utama orchestrator (`run()` / `generate()`) murni berupa deklarasi aliran data (Dataflow Pipeline) tanpa *inline parsing*, tanpa *conditional branching*, dan tanpa *state mutation* liar:
>   ```typescript
>   // Standar Emas SSOT (seperti pada ContractGeneratorPass):
>   const contracts = extractRequestContracts(requestTypesArtifact, this.deps.actionGenerator);
>   const responseResult = extractResponseSchemas(requestTypesArtifact, this.deps.responseActionBuilder);
>   const builtCode = formatContractFile(contracts, responseResult.fields, this.deps.codeBuilder);
>   const artifact = buildContractArtifact(
>       builtCode,
>       contracts,
>       responseResult.fields,
>       this.name,
>       responseResult.warnings
>   );
>   return [artifact];
>   ```
> - **Active Consumer vs Fake Re-export Wrapper (Larangan Keras)**:
>   - **BENAR (Active Consumer Sejati)**: File orchestrator memiliki tugas komputasi/flow yang jelas (`run()`, `compile()`, `execute()`, `analyze()`). Ia mengimpor fungsi-fungsi dari sub-domain (`collect*`, `assemble*`, `build*`) lalu mengonsumsinya untuk menjalankan pipeline (contoh: `MapperGeneratorPass` mengonsumsi `collectMapperParts`, `assembleMapperCode`, dan `buildMapperArtifact` di method `run()`).
>   - **SALAH (Fake Re-export Wrapper / Barrel Terselubung)**: File yang hanya berisi daftar `import { X, Y } from './sub'` lalu langsung `export { X, Y }` tanpa ada fungsi, class, atau alur komputasi yang mengonsumsi simbol-simbol tersebut. Ini bukan Active Consumer, melainkan barrel pasif dengan baju named re-export!
>   - **Jika sebuah modul adalah Domain Descriptors / Analysis Tool**: File utama harus bertindak sebagai koordinator operasional (misal class analisis yang menjalankan `SSABuilder.insertPhiNodes` lalu `SSARenamer.rename`, atau semantic builder yang merakit descriptor secara terpadu).
> - **Unifying Composite Entry Point**: Di bagian akhir file, sediakan constructor penyatu atau pure transform lowerer (seperti `lowerContractArtifact(artifact)`) untuk dikonsumsi downstream secara langsung dengan 0 'new' di call site dan 0 defensive fallback.

---

### 15. Standar Subatomik Functor & Intrinsic Schema (Level 7 Architecture & Atom-to-Atom Upgrade Path)
> **"Di level tertinggi, entitas domain tidak dibangun dari kumpulan flag/string mentah, melainkan tersusun dari Monadic Functor Compositions dan Intrinsic Domain Carriers yang membasmi ambiguitas hingga ke partikel terkecil."**

#### A. Prinsip Inti Subatomik
1. **Penyatuan Bentuk Monadik ($\mathcal{W} \circ \mathcal{C}$)**:
   - Dilarang memisahkan `nullable`, `collection`, dan `paginated` menjadi sekumpulan boolean/flag terpisah. Kumpulan flag boolean menciptakan $2^n$ ledakan kombinasi cabang kondisi (*state explosion*).
   - Bentuk data wajib dimodelkan sebagai **Monadic Functor Tree** (`TypeWrapper<Carrier>`):
     $$\text{Shape} = \mathcal{W}_n(\mathcal{W}_{n-1}(\dots \text{Carrier}))$$
     - *Array of Nullables*: `Collection(Nullable(Carrier))` $\to$ `z.array(schema.nullable())`
     - *Nullable Array*: `Nullable(Collection(Carrier))` $\to$ `z.array(schema).nullable()`
2. **Intrinsic Carrier (Bukan String Mentah)**:
   - Dilarang merepresentasikan target model/resource dengan `string` mentah.
   - Carrier wajib berupa **Intrinsic Domain Carrier** (`ScalarCarrier`, `ModelCarrier`, `ResourceCarrier`, `StructuralCarrier`) yang membawa pembuktian langsung ke AST dan Symbol Table compiler.
3. **Catamorphic Functor Reduction ($fmap$)**:
   - Transformasi dari pohon Functor ke target emisi (Zod, TS, Form) **wajib murni melalui Catamorphism bottom-up** (`foldTypeWrapper` & `matchDomainCarrier`) dengan **0 `if`, 0 `switch`**.

#### B. Matriks Peningkatan Atom-ke-Atom (Subatomic Upgrade Path)

Saat merapikan modul atau tipe data apa pun di RouteSync, tingkatkan atom-atom penyusunnya mengikuti tangga kematangan berikut:

| Dimensi Atom | Level Rendah (Dilarang) | Level 5 (ADT Standar) | Level 6 (Correct-by-Construction) | Level 7 (Subatomic Functor - Target Mutlak) |
|---|---|---|---|---|
| **Atom Bentuk (Shape)** | `isNullable: boolean`, `isCollection: boolean` | Enum terpisah (`FieldCardinality`, `FieldNullability`) | Closed Sub-Contracts (0 `?:`) | **`TypeWrapper<Carrier>`** (`Identity \| Nullable \| Collection \| Paginated`) |
| **Atom Entitas (Carrier)** | `model?: string`, `resource?: string` (string mentah) | Discriminated union (`kind: 'model'`) | Branded identifier (`ModelIdentifier`) + Ref | **`DomainCarrier`** (`Scalar \| Model \| Resource \| Structural`) |
| **Atom Wadah (Container)** | `Record<string, unknown>`, property bag | `Record<string, FieldNode>` | `readonly FieldEntryNode[]` | **`SchemaFieldMorphism[]`** (Lens Coordinate $\to$ Functor Shape) |
| **Atom Proyeksi (Projection)** | 17+ `if/else if`, loop probing | Visitor polymorphic | Catamorphic matchers (`match*`) | **`foldTypeWrapper` (Functor Algebra $fmap$ direct ke `CodeSink`)** |
| **Atom Bukti (Proof)** | Sentinel `null`, `undefined` | String assertion `as ...` | Constructor freeze + non-nullable | **Intrinsic Symbol Proof (Kompilasi gagal jika simbol tak terdaftar)** |

#### C. Protokol Pencarian & Eliminasi Interface dengan Branching Terburuk (Worst Branching Interface Audit)

> **"Branching di generator hilir bukan salah penulisan kode di hilir, melainkan gejala klinis dari interface hulu yang keropos (*porous leaky interface*)."**

Untuk menemukan interface yang memicu branching terparah di codebase, gunakan **Interface Porosity Score (IPS)**:

$$\text{IPS} = \frac{\text{Field Opsional }(?:) + \text{Field }(any/unknown) + \text{Naked Record}}{\text{Total Field}} \times 100\%$$

- **IPS $\ge 70\%$ (Zona Merah - Biang Kerok Branching)**: Interface wajib dirombak total menjadi Closed Sub-Contracts (Rule 10).
- **IPS $\ge 30\%$ (Zona Kuning - Rentan Defensif)**: Harus dieliminasi tanda `?:`-nya menggunakan Explicit Semantic Factories (`.empty()`, `.fromRules()`).

##### 1. Skrip Otomatis Pendeteksi Interface Terburuk (Auditor Script)
Jalankan skrip ini untuk memindai interface dengan branching terburuk di seluruh `packages/core` dan `packages/cli`:
```bash
node -e "
  const fs = require('fs');
  const path = require('path');
  function walk(dir) {
    let r = [];
    fs.readdirSync(dir).forEach(f => {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        if (!p.includes('node_modules') && !p.includes('dist') && !p.includes('tests')) r = r.concat(walk(p));
      } else if (f.endsWith('.ts') && !f.endsWith('.d.ts')) r.push(p);
    });
    return r;
  }
  const files = walk('packages/cli/src').concat(walk('packages/core/src'));
  const stats = [];
  files.forEach(f => {
    const c = fs.readFileSync(f, 'utf8');
    const regex = /(?:export\s+)?interface\s+([A-Za-z0-9_]+)[^{]*\{([^}]+)\}/g;
    let m;
    while ((m = regex.exec(c)) !== null) {
      const name = m[1];
      const lines = m[2].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//') && !l.startsWith('*'));
      const opts = lines.filter(l => /^[a-zA-Z0-9_]+\s*\?:|readonly\s+[a-zA-Z0-9_]+\s*\?:/.test(l)).length;
      const recs = lines.filter(l => /Record<|any\b|unknown\b/.test(l)).length;
      const ips = lines.length > 0 ? Math.round(((opts + recs) / lines.length) * 100) : 0;
      if (opts > 0 || recs > 0) stats.push({ name, file: path.basename(f), total: lines.length, opts, recs, ips });
    }
  });
  stats.sort((a, b) => b.ips - a.ips || b.opts - a.opts);
  console.log('TOP 10 INTERFACE DENGAN BRANCHING TERBURUK (IPS TERTINGGI):');
  stats.slice(0, 10).forEach(s => console.log(s.ips.toString().padStart(3) + '% IPS | ' + s.opts + ' ?: | ' + s.recs + ' any/rec | ' + s.total + ' fields | ' + s.name + ' (' + s.file + ')'));
"
```

##### 2. Daftar Biang Kerok Terburuk yang Teridentifikasi (Hall of Shame)
1. **`SparseRouteParams`** (`boundaryBasics.ts`): **IPS 93%** (28 opsional dari 30 field, 13 `any`) $\to$ Pemicu 40+ `if` di route scanner & resolvers.
2. **`SemanticNode`** (`normalizerTypes.ts`): **IPS 80%** (8 opsional dari 10 field) $\to$ Pemicu 17 `if` di `fieldNormalizer.ts`.
3. **`RuntimeAugmented`** (`normalizerTypes.ts`): **IPS 89%** (8 opsional, `Record`, `unknown`).
4. **`RawRoute.response`** (`incrementalTypes.ts`): **IPS 100%** (untyped JSON bag) $\to$ Pemicu 19 `if` di `typeResolver.ts`.

##### 3. Aksi Perbaikan Wajib
Setiap kali interface dengan IPS $\ge 70\%$ ditemukan:
1. **Dilarang menambahkan `if` baru** di hilir untuk mengantisipasi `undefined`.
2. **Wajib potong di hulu (Origin Boundary)**: Ubah interface menjadi **Closed Sub-Contracts dengan IPS = 0%** (0 `?:`, 0 `any`, 0 `Record`).
3. Seluruh variasi state wajib dibentuk via **Discriminated Union ADT** atau **Static Semantic Factory** (`.empty()`, `.fromValidated()`).

---

## Pola Bug yang Sering Muncul

### Pattern A: `z.unknown()` pada field yang seharusnya typed
**Kemungkinan penyebab (cek berurutan):**
1. Method Eloquent tidak ada di subscanner model / type deriver → tambahkan penanganan di `ModelScanner.ts` atau `TypeDeriver.ts`
2. Variabel plural tidak bisa di-resolve ke model → cek `VariableResolver.ts` heuristic
3. Accessor di model tidak ter-resolve → cek `AccessorResolver.ts` early-return guard
4. Kolom `nullable: true` tapi bukan dari `?->` → cek `ExpressionResolver.ts` nullsafe handler
5. Assignment di dalam closure discarded → cek assignment scanning di `ControllerActionScanner.ts`

### Pattern B: Schema field wrapped/unwrapped salah
**Kemungkinan penyebab:**
1. `JsonResource` pakai default `$wrap = 'data'` → cek `ResourceScanner.ts` wrap detection
2. `use X as Y` alias tidak ter-resolve → cek alias resolver di scanner

### Pattern C: Build & Type Check
**Kemungkinan penyebab:**
1. Build belum dijalankan setelah ubah source → `npm run build`
2. Modul domain belum di-re-export dari `types/domain/index.ts`

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

# RouteSync Agent Operating Flow

## Ground Truth

For Laravel scanner/AST/ADT work, the authoritative source is the actual Laravel project in the Library, specifically the `ecommerce_shop` source archive when that project is the requested fixture. Never treat `routesync.manifest.json` or another generated manifest as the source of truth for syntax or response semantics.

## Mandatory Repair Flow

When asked to `trace`, `saran perbaikan`, or `perbaiki`, execute this order:

1. **Trace source first**
   - Locate the actual Laravel source.
   - Enumerate constructs actually used by controllers, resources, requests, models, and routes.
   - Record examples of every construct that affects generated dataflow/contract.

2. **Trace the complete dataflow**
   ```text
   Laravel source
     -> lexer/token ADT
     -> expression AST ADT
     -> statement/dataflow AST
     -> semantic/controller contract ADT
     -> domain graph/IR
     -> lowerer
     -> emitter
   ```
   At every boundary ask: **what information was present upstream and is missing downstream?**

3. **Repair interfaces before implementation logic**
   - Prefer closed ADTs with explicit domain vocabulary.
   - Do not introduce `Record<string, unknown>` as a substitute for missing vocabulary.
   - Do not use `unknown`, `any`, `null`, `undefined`, optional `?`, or defensive fallback to represent a semantic case that can be modeled by an ADT.
   - Do not use a free `string` discriminator such as `kind: string`.
   - Do not use boolean flags when the states are semantically distinct, e.g. `isDefault`; use ADT variants.
   - Do not duplicate the same semantic data under two fields, e.g. `arguments` plus `argumentDescriptors`. Choose one SSOT representation.

4. **No semantic information loss**
   Every source construct observed in the fixture must map to an explicit AST/ADT variant. If a construct is genuinely unsupported, keep a closed `unsupported` variant with a typed reason and trace it. Never silently convert a known construct to `unknown`.

5. **Special AST rules**
   - PHP arrays must preserve positional, keyed, and computed keys.
   - Match expressions must distinguish conditional arms from the default arm.
   - Assignments must preserve target and value so later variable references can be resolved by dataflow.
   - Array access, function calls, null coalesce, short ternary, binary/unary expressions, casts, and match must remain explicit through every required boundary.
   - PHP `=>` is array/match structure, not a binary expression operator.
   - Lexer operators must use a closed operator vocabulary rather than `OPERATOR + string`.
- Verify `??`, `?:`, `??=`, `===`, `!==`, comparison, arithmetic, logical, and concatenation operators as distinct token variants against real fixture snippets.

6. **Trace consumers after changing an upstream interface**
   Search every consumer of changed fields. Examples: `entry.key`, `keyExpression`, `isDefault`, `argumentDescriptors`, and AST `kind`. Fix all consumers instead of weakening the interface to preserve old code.

7. **Verify against the real fixture**
   Regression tests must include constructs taken from the actual `ecommerce_shop` source, especially:
   - `?->`
   - `??`
   - `?:`
   - array access
   - nested arrays
   - function calls
   - casts
   - arithmetic/comparison/logical expressions
   - `match`
   - assignments used by later expressions

8. **Report remaining loss explicitly**
   The trace must state:
   - source construct count/sample,
   - AST variant produced,
   - semantic variant produced,
   - any remaining `unsupported`, `unknown`, `any`, or free string boundary,
   - exact next repair phase.

## Invariants

```text
SOURCE CONSTRUCT
  -> EXACT TOKEN/AST VARIANT
  -> EXACT SEMANTIC VARIANT
  -> NO OPTIONAL SEMANTIC FIELD
  -> NO UNKNOWN FALLBACK FOR KNOWN CONSTRUCT
  -> NO RECORD/ANY AS DOMAIN MODEL
  -> NO STRING RE-CLASSIFICATION DOWNSTREAM
  -> PURE DOWNSTREAM TRANSFORMATION
```

## Agent Rule

Never stop after changing one interface. After every repair, immediately re-trace downstream consumers and the real Laravel fixture. The goal is not merely a type-checking interface. The goal is a **complete, information-preserving dataflow model** from Laravel source to generated output.

## Mandatory Post-Repair Trace Loop

After each repair phase, run this exact loop before declaring the phase complete:

```text
1. Re-scan real ecommerce_shop source
2. Enumerate source constructs actually observed
3. Map each construct -> token variant
4. Map token sequence -> exact AST variant
5. Map AST variant -> exact semantic ADT variant
6. Trace every changed field consumer
7. Search for information collapse: unknown / any / Record / optional / boolean-state / string discriminator
8. Repair the next boundary that loses information
9. Add regression coverage for the observed source construct
10. Repeat until no known ecommerce_shop construct is silently downgraded
```

### Phase Exit Criteria
A phase is not complete merely because TypeScript compiles. It is complete only when the trace proves:
- every changed upstream field has all consumers updated;
- every known `ecommerce_shop` construct reaches a typed downstream representation;
- generic `OPERATOR` tokens are not used for known operators;
- assignments needed by later expressions remain in the statement/dataflow model;
- `unsupported` is limited to genuinely unimplemented constructs and is listed explicitly;
- generated manifests are never used to invent missing source semantics.


## Phase 103 Rule: Semantic Expression Preservation

For the Laravel source fixture `ecommerce_shop`, the resource semantic boundary must never replace a known scanner expression with `unsupported_syntax` merely because its semantic type is not yet resolved.

Known expression flow:
```text
PHP source
  -> PhpAstValue
  -> Controller/Resource semantic expression ADT
  -> verified semantic type or explicit semantic-absence state
```

The following observed constructs must remain explicit through the resource expression boundary:
- array access
- function call
- short ternary
- null coalesce
- ternary
- binary expression
- unary expression
- cast
- nullsafe/direct property access
- nullsafe/direct method call

A syntax expression may carry a temporarily unresolved semantic type, but its syntax must not be destroyed. `unsupported` is reserved for a construct for which the parser genuinely has no AST vocabulary.

When changing scanner AST fields such as `access`, `operator`, or `arguments`, search every consumer before changing the interface. Do not restore the old interface merely to make legacy consumers compile.

### Phase 103 Source Gate

Use the real Library `ecommerce_shop` source as the regression fixture. The observed baseline in the scanned archive includes approximately:
- 42 nullsafe operators `?->`
- 62 null-coalesce operators `??`
- 15 short ternaries `?:`
- 6 `match` expressions
- 27 array-access expressions
- 48 explicit scalar/object/array casts
- 229 assignment occurrences
- 93 `if` occurrences
- 3 `foreach` occurrences
- 3 `for` occurrences
- 1 `try` and 1 `catch`

These counts are source observations, not generated-manifest facts. If the fixture changes, re-scan and update the trace rather than copying old counts.

## Phase 104 Rule: Statement/Dataflow Preservation

When a Laravel expression is assigned and referenced later, the scanner must preserve both sides of the dependency:
```text
assignment target -> origin expression -> later variable reference -> origin binding
```

Controller body AST must preserve the control-flow constructs observed in the real fixture when they can affect dataflow:
- `if` / `else` / `else if`
- `foreach`
- `for`
- `try` / `catch` / `finally`
- `throw`

Do not flatten these constructs into unrelated expression statements. Do not treat a parser success with a trailing `expression_statement` for `EOF` or `}` as valid; structural delimiters must be consumed by the enclosing block parser.

Variable origins are explicit states:
- parameter
- local assignment
- external

An assignment must not resolve its own definition as the origin of its right-hand side. Loop and catch bindings are introduced by their owning control-flow statement and must be visible to the statements inside that block.

For `for` clauses, an assignment initializer/update is an assignment clause, not an arbitrary expression string.

After changing statement/dataflow ASTs, re-trace:
```text
source statement
 -> statement ADT
 -> expression ADT
 -> variable definition
 -> later reference
 -> origin
```

Do not claim dataflow completeness merely because the AST parser recognizes the outer control-flow keyword. Verify the bindings created and consumed inside the construct.


## Phase 105 Rule: Dataflow Must Cross the Semantic Boundary

Controller body dataflow is not complete when it exists only in `ControllerBodyAst`. The semantic controller contract and scanned action descriptor must carry the same dataflow without flattening it into `Map<string, string>`.

The controller resource binding vocabulary is closed: a resource binding carries its resource identity and a model origin ADT (`model_class` or `table`). Resource-model resolution may interpret that ADT against `ModelSymbolTable`, but must not reconstruct it from an untyped string map.

The controller dataflow contract must preserve the original AST dataflow plus explicit resource bindings derived from the return expression and its variable origins. Direct resource construction and static `Resource::collection(...)` forms must remain distinguishable. Typed controller parameters are valid origins for resource arguments.

Relation propagation remains a separate relation-graph concern and may retain its explicit resource-to-model graph representation; it must not be confused with controller-origin dataflow.

After this repair, trace: `controller source -> PhpStatement -> ControllerBodyAst -> ControllerDataflowAst -> ControllerDataflowContract -> ControllerResourceBinding -> ResourceModelResolver -> ModelSymbolTable`. Report any remaining branch-sensitive dominance/merge limitation instead of silently guessing.

## Phase 106: Method-Chain Origin Preservation
- Controller model-origin resolution must traverse `method_chain.receiver` back to the originating static call or parameter.
- `$query->paginate()` must preserve the model origin carried by `$query = Model::query()`.
- `DB::table(...)->...` must preserve the explicit table origin through the chain.
- Resource discovery must inspect method-chain receivers and function-call arguments so wrappers such as `response()->json(new Resource(...))` do not erase resource bindings.
- Recursive variable resolution must guard against cyclic definitions.
- Do not reintroduce `resourceModelMap` or string-based semantic reconstruction.

## Phase 107 Rule — Branch-Aware Controller Dataflow
- Controller variable definitions must carry availability semantics at the AST boundary.
- Definitions inside conditional, loop, and catch regions are not globally definite after the region.
- Branch merge may expose only facts guaranteed on every reachable path.
- Resource/model binding must consume only definite definitions and must not select a conditional definition by reverse lexical order.
- Reference origin must retain the actual definition statement index when a definite local origin exists.
- Retrace: `Controller source -> PhpStatement -> ControllerDataflowAst -> availability -> ControllerDataflowContract -> ResourceBinding`.
