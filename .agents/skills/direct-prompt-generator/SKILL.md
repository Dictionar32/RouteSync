---
name: direct-prompt-generator
description: >-
  Use this skill whenever the user asks to generate, craft, or write an execution prompt.
  Enforces zero repetitive explanations, zero conversational preamble, and direct output of the prompt markdown.
---

# Direct Prompt Generator

## Core Instruction
When the user asks to create, formulate, or generate a prompt:
1. **Zero Repetitive Explanations**: Do NOT output meta-explanations explaining what the prompt does, why it was created, or repeating previous discussions before/after the prompt block.
2. **Direct Output**: Immediately output the exact, ready-to-execute markdown block containing the prompt.
3. **Product & Tool Design Engineering Standard (Rule & Solution Pairing)**:
   Setiap larangan WAJIB dipasangkan dengan solusi arsitektural konkret:
   - **Larangan 1: Naked `Record<string, ...>` & Loose Property Bags**
     * *Akar Masalah*: Menghilangkan identitas semantik domain dan memaksa defensive checks di downstream passes.
     * *Solusi Wajib*: Ganti dengan **First-Class Domain Specifications & Symbol Tables** (contoh: `RouteParameterSpecification`, `HttpHeaderCatalog`) yang mengkapsulasi data dalam private `ReadonlyMap`, menerapkan O(1) canonical lookup, dan mengekspos iterator `Iterable<TDescriptor>`.
   - **Larangan 2: Fake Wrapper Classes yang Menyamarkan Hacking**
     * *Akar Masalah*: Membungkus kelas baru tetapi tetap melakukan `(this as Record<string, unknown>)[k] = v` demi mempertahankan mutasi indeks dinamis.
     * *Solusi Wajib*: Terapkan **Pure Value Objects & Immutable Collections**. Larang class index signature. Konstruksi data hanya melalui Complete Constructor Contract (100% direct assignment) dan Static Semantic Factory (`.empty()`, `.fromEntries()`).
   - **Larangan 3: Serialisasi Bocor ke Domain Model**
     * *Akar Masalah*: Kebutuhan library eksternal (Fetch/Axios plain object) mengotori internal domain compiler.
     * *Solusi Wajib*: Terapkan **Isolated Boundary Adapters**. Internal domain tetap murni ADT/Specification; konversi ke dictionary plain object diisolasi hanya pada single boundary method `.toDictionary()` / `.toRecord()` saat serialisasi keluar.
   - **Larangan 4: Pencampuran Authoring DX dengan Compiler IR**
     * *Akar Masalah*: Opsi opsional user (`auth?`, `timeout?`) mengotori compiler engine dan memaksa branching.
     * *Solusi Wajib*: Terapkan **Separation of Boundary Concerns**. Authoring Layer (SDK) fleksibel dengan tanda `?` untuk kenyamanan user, tetapi dinormalisasi di Origin Boundary menjadi Compiler IR yang **Zero `?`, Zero `any`, Zero `null`**.
   - **Larangan 5: Sentinel `null` pada Nilai AST**
     * *Akar Masalah*: Menimbulkan runtime inspection `if (val === null)` di hilir compiler.
     * *Solusi Wajib*: Pisahkan menjadi **Discriminated Union AST Variants** (`ScalarLiteralAST` vs `NullLiteralAST`) yang di-dispatch secara catamorphic murni (0 `if`, 0 `switch`).
   - **Larangan 6: Fragmented Porous Parameters & Defective Hulu Probing**
     * *Akar Masalah*: Data rute disebarkan ke puluhan field opsional (`?:`) di constructor hulu, memaksa hilir (normalizer & generator) menebak manual dengan puluhan `if` dan `??`.
     * *Solusi Wajib*: Terapkan **Holistic Immutable Route Contracts & Upstream Complete Constructor Data Aggregation (Point A & B)**:
       - **Prinsip Utama**: **Semua data domain WAJIB dikumpulkan dan divalidasi tuntas di hulu (Upstream Origin Boundary) melalui Complete Constructor (0 `?`, 0 `??`), sehingga downstream compiler passes dan code generators dapat langsung mengonsumsi datanya secara deterministik tanpa branching penyelidik jenis atau fallback defensif.**
       - **Point A: Type Vocabulary Design (TTD) — Holistic Route Domain Node**:
         Satukan seluruh aspek rute ke dalam 3 sub-kontrak tertutup non-nullable:
         1. `RouteIdentityContract`: path, method, name, parameter specifications (`PathSpec`).
         2. `RouteBindingContract`: handler (ADT), schema (FormSpec), response (ResponseSpec).
         3. `RouteCapabilityContract`: auth, security, invalidation (KeySpec), crudRole (RoleSpec).
       - **Point B: Constructor Dataflow — Semua Data Digabung Jadi Satu di Origin Boundary**:
         Constructor entitas hulu (seperti `ScannedRouteDescriptor`) wajib 100% direct assignment (0 `?`, 0 `??`):
         ```typescript
         export class ScannedRouteDescriptor {
           readonly identity: RouteIdentityContract;     // Dijamin utuh non-nullable
           readonly binding: RouteBindingContract;       // Dijamin utuh non-nullable
           readonly capability: RouteCapabilityContract; // Dijamin utuh non-nullable
           constructor(identity: RouteIdentityContract, binding: RouteBindingContract, capability: RouteCapabilityContract) {
             this.identity = identity;
             this.binding = binding;
             this.capability = capability;
             Object.freeze(this);
           }
         }
         ```
       - **Dampak pada Downstream**: Downstream tidak lagi bertanya *"apakah route ini punya handler?"* atau *"apakah parameternya ada?"* karena seluruh invariant sudah tergaransi lengkap sejak hulu.
   - **Larangan 7: Downstream Manual Branching Inspection di Code Generator**
     * *Akar Masalah*: Generator hilir bertanya *"kamu jenis apa?"* via `if (route.method === 'GET')` atau `if (route.isCrud)`.
     * *Solusi Wajib*: Terapkan **Pure Dataflow & Self-Projecting Capabilities**:
       - Pipeline ideal: $\text{Laravel AST} \xrightarrow{\text{classifyRoute()}} \text{Stream}(\text{ClassifiedRouteNode}) \xrightarrow{\text{yield* } \text{route.emit}()} \text{Output}$.
       - **Aksioma Self-Projecting**: Objek domain memegang kapabilitas mandiri untuk memproyeksikan dirinya ke emitter/sink (`yield* route.projectToHookSource()`), bukan generator yang memeriksa tipe secara eksternal (`if (route.method === 'GET')`).
       - Standar emas: **1 Stream, 1 Pass (`for`), 0 `if`, 0 `switch`, 0 multiple `for`**.
       - Keuntungan: 0 Branching di generator/normalizer, static exhaustiveness check via compiler, dan 100% end-to-end data provenance traceability.
   - **Larangan 8: Kebalikan dari CDA (Anti-Pattern: Parameter Bag Purba + Procedural Discovery di Descriptor)**
     * *Akar Masalah (Kebalikan dari CDA)*: Mendefinisikan model level tinggi (seperti 4 Closed Sub-Contracts), tetapi di dalam descriptor factory (`create()`) justru menerima parameter bag 28-field serba opsional (`?:`), lalu melakukan procedural string hacking (5 `if` membedah `@`, 7 `if` menebak domain, regex + 5 ternary menebak CRUD role, loop rules menebak multipart vs json), dan baru di baris terakhir dibungkus ke dalam sub-contracts.
     * *Contoh Salah (Anti-Pattern: Parameter Bag Purba + Procedural Guessing)*:
       ```typescript
       // ❌ SALAH: Descriptor difungsikan sebagai parser prosedural penuh tebak-tebakan
       public static create({
           name, method, path, resourceName, domain, action, actionName, ... // 28 field opsional (?:)
       }: { readonly name?: string; readonly method: HttpMethod; ... }): ScannedRouteDescriptor {
           if (action && action.includes('@')) { ... } // 5 if membedah string
           if (!resolvedCrudRole) { ... } // 5 ternary menebak CRUD role
           const resolvedDomain = domain ? domain : resolveDomain(...); // 7 if menebak domain
           // Baru di akhir dibungkus ke sub-contracts:
           return new ScannedRouteDescriptor({ identity, binding, capability, provenance, contract });
       }
       ```
     * *Contoh Benar (Sesuai CDA & Correct-by-Construction)*:
       **Seharusnya data dibentuk dan divalidasi oleh First-Class Domain Models di Origin Boundary, bukan dikumpulkan lewat parameter serba opsional lalu ditebak-tebak di dalam descriptor.**
       ```typescript
       // ✅ BENAR: Data dibentuk oleh First-Class Domain Models di Origin Boundary
       // 1. Parsing string controller dilakukan di Lexer/Parser boundary, bukan di descriptor
       // 2. Domain di-resolve oleh RouteDomainResolver (O(1) table lookup)
       // 3. CRUD role di-resolve oleh RouteCrudClassifier (ADT table lookup)
       // 4. Content-type di-resolve di RequestTypeDeriver saat FormRequest di-scan
       // 5. Descriptor create() murni mengonsumsi 4 Complete Sub-Contracts (0 '?:', 0 'if', 0 '??', 0 '?.')
       public static create({
           identity,
           binding,
           capability,
           provenance
       }: {
           readonly identity: RouteIdentityContract;
           readonly binding: RouteBindingContract;
           readonly capability: RouteCapabilityContract;
           readonly provenance: RouteProvenanceContract;
       }): ScannedRouteDescriptor {
           const contract = ScannedEndpointContract.fromSubcontracts({ identity, binding, capability, provenance });
           return new ScannedRouteDescriptor({ identity, binding, capability, provenance, contract });
       }
       ```
4. **Structured Format**: Ensure the generated prompt strictly embeds:
   - Root cause analysis with 2 architectural options (Upstream vs Downstream).
   - Upstream-first priority with strong Type Vocabulary Design (TTD), Holistic Route Contracts (Point A & B), and Upstream Complete Constructor Data Aggregation (0 `?`).
   - Concrete Architectural Solutions for every banned pattern (paired restriction & solution).
   - Complete Constructor Contracts (0 `?`, 100% direct assignment, static semantic factories).
   - Pure Dataflow Architecture & Self-Projecting Capabilities (1 Stream, 1 Pass, 0 `if`, 0 `switch`).
   - Direct Downstream Consumption without manual branching or guessing.
   - Technical & fatal risk mitigations (handling serialization boundaries and preserving type inference).
   - Fail-fast validation and automated verification commands.
