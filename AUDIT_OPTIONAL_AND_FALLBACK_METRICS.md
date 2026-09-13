# RouteSync — Audit Metrik `?` (Optional Properties, Fallbacks & Optional Chaining)

> **Status Audit**: Baseline Pasca-Refactoring Section D (`routeDescriptors.ts`)  
> **Tanggal**: 12 September 2026  
> **Standar Rujukan**: Rule 10 (Larangan Interface Parameter Serba Opsional) & Rule 12 (Correct-by-Construction Architecture & Pure Dataflow)

---

## 1. Executive Summary

Setelah penyelesaian refactoring pada [`routeDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/routeDescriptors.ts) (seluruh constructor parameter kini **0 `?`** dan body constructor **100% direct assignment**), audit ini memetakan seluruh kemunculan tanda `?` yang tersisa di seluruh basis kode RouteSync.

Tanda `?` dianalisis ke dalam 3 jenis operator:
1. **`?:` (Optional Property)**: Field opsional pada interface, type alias, atau parameter fungsi yang berpotensi melubangi kontrak data (*contract holes*).
2. **`??` (Nullish Coalescing)**: Defensive fallback di downstream code yang biasanya merupakan konsekuensi langsung dari data hulu yang tidak guaranteed non-nullable.
3. **`?.` (Optional Chaining)**: Pengecekan null-safe di tengah alur eksekusi, sering kali menandakan discovery/penyelidikan tipe di tempat yang seharusnya sudah terstruktur.

---

## 2. Peta Ranking Berkas (Top 25)

| Rank | Total `?` | `?:` (Optional Prop) | `??` (Fallback) | `?.` (Opt Chain) | Lokasi Berkas | Kategori Domain |
|:---:|:---:|:---:|:---:|:---:|:---|:---|
| **1** | **147** | 103 | 34 | 10 | [`packages/core/src/compiler/scanner/descriptors/routeDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/routeDescriptors.ts) | Descriptors (*Semua constructor 0 `?`; sisa `?:` berada di static factory option objects*) |
| **2** | **124** | 59 | 3 | 62 | [`packages/react/src/hooks/createCrudHooks.ts`](file:///home/annas-zen/Documents/RouteSync/packages/react/src/hooks/createCrudHooks.ts) | React Hook Factory |
| **3** | **94** | 92 | 0 | 2 | [`packages/core/src/types/ir.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/ir.ts) | Intermediate Representation Types |
| **4** | **11** | 8 | 2* | 1* | [`packages/cli/src/generators/semantic-resolver.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/semantic-resolver.ts) | CLI Semantic Resolver (*✅ 100% Zero `??` & Zero `?.` pada executable code; sisa 2 `??` dan 1 `?.` adalah dokumentasi komentar*) |
| **5** | **92** | 48 | 11 | 33 | [`packages/react/src/hooks/defineHooks.ts`](file:///home/annas-zen/Documents/RouteSync/packages/react/src/hooks/defineHooks.ts) | React Hook Definition |
| **6** | **89** | 44 | 34 | 11 | [`packages/core/src/compiler.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler.ts) | Compiler Orchestrator Legacy |
| **7** | **70** | 0 | 27 | 43 | [`packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts) | AST Type Deriver |
| **8** | **46** | 45 | 1 | 0 | [`packages/core/src/types/semantic.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/semantic.ts) | Semantic Type System |
| **9** | **46** | 1 | 0 | 45 | [`packages/core/src/compiler/scanner/subscanners/ModelScanner.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/subscanners/ModelScanner.ts) | Model AST Lexer / Scanner |
| **10** | **44** | 28 | 11 | 5 | [`packages/cli/src/utils/incremental.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/utils/incremental.ts) | Incremental Scan & Caching |
| **11** | **43** | 32 | 11 | 0 | [`packages/core/src/compiler/scanner/descriptors/modelDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/modelDescriptors.ts) | Model Descriptors |
| **12** | **42** | 12 | 13 | 17 | [`packages/cli/src/generators/route-classifier.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/route-classifier.ts) | Route Classifier |
| **13** | **35** | 32 | 1 | 2 | [`packages/cli/src/generators/normalizer.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/normalizer.ts) | Manifest Normalizer |
| **14** | **34** | 0 | 22 | 12 | [`packages/core/src/types/domain/contracts.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/domain/contracts.ts) | Endpoint Contract Model |
| **15** | **33** | 31 | 0 | 2 | [`packages/core/src/compiler/ir/ResponseArtifact.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/ir/ResponseArtifact.ts) | Response Artifact IR |
| **16** | **32** | 32 | 0 | 0 | [`packages/core/src/types/request.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/request.ts) | Request Types |
| **17** | **30** | 20 | 4 | 6 | [`packages/sdk/src/defineApi.ts`](file:///home/annas-zen/Documents/RouteSync/packages/sdk/src/defineApi.ts) | SDK API Definition |
| **18** | **27** | 21 | 0 | 6 | [`packages/core/src/ir/ContractIRBuilder.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/ir/ContractIRBuilder.ts) | Contract IR Builder |
| **19** | **26** | 3 | 2 | 21 | [`packages/core/src/compiler/domain/common/SemanticTypeResolver.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/domain/common/SemanticTypeResolver.ts) | Semantic Type Resolver |
| **20** | **25** | 14 | 7 | 4 | [`packages/core/src/compiler/scanner/descriptors/channelDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/channelDescriptors.ts) | Broadcast Channel Descriptors |
| **21** | **24** | 16 | 3 | 5 | [`packages/core/src/compiler/types/SemanticType.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/types/SemanticType.ts) | Compiler Semantic Types |
| **22** | **23** | 1 | 3 | 19 | [`packages/core/src/compiler/scanner/subscanners/RouteScanner.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/subscanners/RouteScanner.ts) | Route Lexer Subscanner |
| **23** | **23** | 23 | 0 | 0 | [`packages/core/src/semantic/types.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/semantic/types.ts) | Semantic Spec Types |
| **24** | **22** | 22 | 0 | 0 | [`packages/core/src/types/field.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/field.ts) | Field Definition Types |
| **25** | **21** | 19 | 2 | 0 | [`packages/core/src/compiler/scanner/descriptors/requestDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/requestDescriptors.ts) | Request & Form Field Descriptors |

---

## 3. Klasifikasi Arsitektural & Rencana Penanganan

### Cluster 1: Descriptors Layer (Target Alami Pembersihan Constructor)
File-file descriptor bertugas memodelkan representasi AST yang beku (`Object.freeze`). Sebagian besar constructor sudah bersih, namun masih menyisakan fallback minor:

1. **[`modelDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/modelDescriptors.ts)**: ✅ **SELESAI (100% Clean Constructors & Complete Contracts)**
   - `ScannedModelDescriptor`, `ScannedModelRelationDescriptor`, `ScannedModelColumnDescriptor`, `ScannedModelCastDescriptor`, `ScannedModelAccessorDescriptor`.
   - Seluruh interface constructor parameter 0 `?`. Seluruh constructor 100% direct assignment (`this.x = params.x`).
   - Default resolution & `Object.freeze` dipindahkan sepenuhnya ke Static Semantic Factories (`.create()`, `.empty()`, `.fromTable()`, `.none()`, `.belongsTo()`, `.hasMany()`, `.single()`, `.collection()`, `.primaryKey()`, `.string()`, `.fromReturnType()`, `.fromMapping()`).
2. **[`requestDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/requestDescriptors.ts)**: ✅ **SELESAI (100% Clean Constructors & Complete Contracts)**
   - `ScannedControllerActionDescriptor`, `ScannedFormFieldDescriptor`, `ScannedFormActionDescriptor`, `ScannedRequestTypeDescriptor`.
   - Seluruh interface constructor parameter 0 `?`. Seluruh constructor 100% direct assignment (0 `??`, 0 `?.`, 0 `if (!x)`).
   - Static Semantic Factories di Origin Boundary (`.create()`, `.empty()`, `.required()`, `.optional()`, `.file()`).
3. **[`channelDescriptors.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/descriptors/channelDescriptors.ts)**: ✅ **SELESAI (100% Clean Constructor & Complete Contract)**
   - `ScannedBroadcastChannelDescriptor`.
   - Interface constructor parameter `ScannedBroadcastChannelParams` 0 `?`. Constructor 100% direct assignment (`this.parameters = parameters`).
   - Helper `compileBroadcastRuntimePattern()` di Origin Boundary, mengeliminasi duplikasi regex.
   - Semantic factories `.public()`, `.private()`, `.presence()` mengembalikan instance resmi class.

> **Status Cluster 1 (Descriptors Layer)**: 🏆 **100% SELESAI** — Seluruh berkas descriptor di RouteSync (`routeDescriptors.ts`, `modelDescriptors.ts`, `requestDescriptors.ts`, `channelDescriptors.ts`) kini 100% Complete Contract & Clean Constructor.

---

### Cluster 2: Downstream Generators & Resolvers (Efek Domino Data Hulu)
File-file ini mengalami **defensive proliferation** karena data upstream sebelumnya belum 100% guaranteed non-nullable:

1. **[`semantic-resolver.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/semantic-resolver.ts)**: ✅ **SELESAI (100% Zero `??` & Zero `?.` pada executable code)**
   - Normalisasi input dilakukan di Origin Boundary via `SemanticResolutionContext.fromManifest(manifest)` dengan O(1) indexed maps (`modelsByName`, `resourcesByName`).
   - Ekstraksi AST `$this->property` dan ternary null guard dipisahkan menjadi pure fail-fast type guards.
   - Centralized `mapSqlTypeToMapping` di `canonical-names.ts`.
   - Complete Contract `FieldResolutionMeta` & factory `toFieldResolutionMeta`.
   - Regression test: `packages/sdk/tests/pureSemanticResolverContracts.spec.ts` (12 tests, 100% GREEN).
2. **[`SemanticTypeDeriver.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/scanner/subscanners/SemanticTypeDeriver.ts)** (70 `?`: 27 `??`, 43 `?.`):
   - Penebakan tipe response PHP yang banyak memeriksa `returnType?.name ?? 'unknown'`.
3. **[`route-classifier.ts`](file:///home/annas-zen/Documents/RouteSync/packages/cli/src/generators/route-classifier.ts)** (42 `?`: 13 `??`, 17 `?.`):
   - Pemilihan klasifikasi rute yang masih melakukan pengecekan berulang terhadap `route.handler?.kind`.

---

### Cluster 3: Client / React Hooks Layer
Lapisan pembuat hook client-side yang berurusan dengan opsi runtime React Query:

1. **[`createCrudHooks.ts`](file:///home/annas-zen/Documents/RouteSync/packages/react/src/hooks/createCrudHooks.ts)** (124 `?`: 59 `?:`, 62 `?.`, 3 `??`):
   - Dominasi `?.` berasal dari opsi pemanggilan hook: `options?.query?.staleTime`, `options?.mutation?.onSuccess?.()`.
   - Sebagian `?.` di sini adalah **idiomatik React Query options**, namun struktur konfigurasi internalnya dapat dirapikan dengan destructuring defaults di Origin Boundary hook generator.
2. **[`defineHooks.ts`](file:///home/annas-zen/Documents/RouteSync/packages/react/src/hooks/defineHooks.ts)** (92 `?`: 48 `?:`, 11 `??`, 33 `?.`).

---

### Cluster 4: Type System & Intermediate Representation (IR) Serba Opsional (Rule 10)
Definisi type legacy di mana interface dibuat serba opsional (`?:`):

1. **[`ir.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/ir.ts)** (92 `?:`)
2. **[`semantic.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/semantic.ts)** (45 `?:`)
3. **[`request.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/types/request.ts)** (32 `?:`)
4. **[`ResponseArtifact.ts`](file:///home/annas-zen/Documents/RouteSync/packages/core/src/compiler/ir/ResponseArtifact.ts)** (31 `?:`)

Dampak: Konsumen IR terpaksa melakukan assertion atau guard `if (ir.field)` di mana-mana karena kontraknya berlubang.

---

## 4. Rekomendasi Roadmap Refactoring Berikutnya

```
[Wave 1: Descriptors Layer]
modelDescriptors.ts + requestDescriptors.ts + channelDescriptors.ts
  └─► Eliminasi 100% '?' pada Constructor Params (Complete Contract & Factories)
        │
        ▼
[Wave 2: Compiler & Semantic Resolver]
semantic-resolver.ts + SemanticTypeDeriver.ts
  └─► Eliminasi 61x '??' dan 78x '?.' (Konsumsi Guaranteed Model & Contract)
        │
        ▼
[Wave 3: Type System & IR Standardization]
ir.ts + semantic.ts + request.ts
  └─► Eliminasi 169x '?:' serba opsional (Penguatan Complete Data Contract)
```
