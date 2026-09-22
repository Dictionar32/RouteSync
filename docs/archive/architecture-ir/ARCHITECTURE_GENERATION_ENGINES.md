# Peta Arsitektur — Single Unified Compiler Engine RouteSync

**Tanggal Pembaruan:** 2026-09-01  
**Status:** Unified Single Engine (Arsitektur Resmi Produksi)  
**Tujuan:** Mendokumentasikan unifikasi arsitektur generate SDK RouteSync menjadi satu jalur kompilator tunggal yang terpadu dan modern.

---

## 1. Ringkasan & Sejarah Unifikasi

Sebelum 1 September 2026, RouteSync memiliki dua jalur generasi paralel yang tumpang tindih (Jalur A Hybrid dan Jalur B Contract IR). Pada tanggal 1 September 2026, seluruh sistem telah **resmi disatukan ke dalam Single Unified Compiler Engine (RouteSync Compiler Core v6.0)**:

| Aspek | Arsitektur Lama (Dual-Track) | Arsitektur Baru (Single Unified Engine) |
|---|---|---|
| **CLI Commands** | `generate` (Jalur A) & `generate-v2` (Jalur B) | **`routesync generate` & `routesync sync` (Tunggal)** |
| **Orkestrator** | `CompilerBridge` & `ContractGenerator` | **`CompilerBridge.ts` (Single Master Orchestrator)** |
| **Arsitektur Inti** | Hybrid Monolith + IR Emitters | **Compiler Pass Architecture (Pass-based Stream)** |
| **Target Folder Kontrak** | Tumpang tindih `contract/` vs `contracts/` | **`contracts/` (Kanonikal, Bersih, Konsisten)** |
| **Status Dead Code** | ~4.700 baris kode monolitik & layer emitters | **Dieliminasi 100%** |

---

## 2. Peta Aliran Single Unified Engine (`CompilerBridge`)

```
CLI generate / sync (packages/cli/src/commands/generate.ts)
│
└─▶ CompilerBridge (packages/cli/src/generators/CompilerBridge.ts)
      │
      ├─▶ 1. generateTypeScript(manifest)
      │     ├─ SemanticTypesPipeline.execute()          ← utils/SemanticTypesPipeline.ts
      │     └─▶ TypeScriptGeneratorPass                 ← packages/core/src/compiler/passes/
      │           └─▶ types/api-read.ts (TypeScript response & entity types)
      │
      ├─▶ 2. generateFormTypes(manifest)
      │     ├─ RequestTypesPipeline.execute()           ← utils/RequestTypesPipeline.ts
      │     └─▶ FormGeneratorPass                       ← packages/core/src/compiler/passes/
      │           └─▶ forms/api-form.ts (TypeScript form interfaces)
      │
      ├─▶ 3. generateContractTypes(manifest)
      │     ├─ ContractInputPipeline.execute()          ← utils/ContractInputPipeline.ts
      │     └─▶ ContractGeneratorPass                   ← packages/core/src/compiler/passes/
      │           └─▶ contracts/api-contract.ts (Zod validation schemas)
      │
      ├─▶ 4. generateApiFieldTypes(manifest)
      │     ├─ ContractInputPipeline.execute()
      │     └─▶ ApiFieldGeneratorPass                   ← packages/core/src/compiler/passes/
      │           └─▶ contracts/api-field.ts (Table metadata & field definitions)
      │
      ├─▶ 5. generateMapperTypes(manifest)
      │     ├─ ContractInputPipeline.execute()
      │     └─▶ MapperGeneratorPass                     ← packages/core/src/compiler/passes/
      │           └─▶ mappers/api-mapper.ts (snake_case ↔ camelCase runtime mappers)
      │
      └─▶ 6. HookGenerator.generate(manifest)           ← packages/cli/src/generators/HookGenerator.ts
            ├─▶ routesync.runtime.ts (Runtime configuration manifest)
            └─▶ hooks.ts (React Query hooks: useQuery / useMutation)
```

---

## 3. Matriks Berkas yang Dihasilkan

Seluruh artefak yang dihasilkan kini terstandarisasi dengan penamaan kanonikal yang jelas:

| File Output | Generator / Pass Penanggung Jawab | Deskripsi Isi |
|---|---|---|
| `types/api-read.ts` | `TypeScriptGeneratorPass` | Tipe data TypeScript untuk response API, Resource, dan Model. |
| `forms/api-form.ts` | `FormGeneratorPass` | Interface form input (`StoreUserForm`, `UpdateProductForm`). |
| `contracts/api-contract.ts` | `ContractGeneratorPass` | Skema validasi Zod untuk runtime request & response validation. |
| `contracts/api-field.ts` | `ApiFieldGeneratorPass` | Definisi field metadata untuk form-binding & table rendering. |
| `mappers/api-mapper.ts` | `MapperGeneratorPass` | Fungsi transformasi data dari `snake_case` (Laravel) ke `camelCase` (Frontend). |
| `routesync.runtime.ts` | `HookGenerator` | Konfigurasi runtime domain, endpoints, dan intent rules. |
| `hooks.ts` | `HookGenerator` | Typed React Query hooks (`useUserList`, `useCreateProductMutation`). |

---

## 4. Riwayat Modul yang Didecommission / Dihapus

Untuk menjaga kebersihan arsitektur, modul-modul berikut telah resmi dihapus dari repositori:

1. 🗑️ `packages/cli/src/generators/ZodTierGenerator.ts` (~1.890 baris) — Monolitik lama Jalur A.
2. 🗑️ `packages/cli/src/generators/ZodTierGeneratorRefactored.ts` (~1.100 baris) — Eksperimen lama.
3. 🗑️ `packages/cli/src/generators/ContractGenerator.ts` (~630 baris) — Engine lama Jalur B.
4. 🗑️ `packages/cli/src/commands/generate-v2.ts` (~120 baris) — CLI command lama Jalur B.
5. 🗑️ `packages/cli/src/generators/layers/` (7 Thin Emitters: `ReadEmitter`, `FormEmitter`, `SchemaEmitter`, `ContractEmitter`, `FieldEmitter`, `MapperEmitter`, `SDKEmitter`).
6. 🗑️ `packages/core/src/types/legacyFieldAdapter.ts` (~200 baris) — Adapter transisi usang.

---

## 5. Dokumen Terkait

- [**`docs/architecture/MANIFEST_TO_TYPES_REFACTORING.md`**](./docs/architecture/MANIFEST_TO_TYPES_REFACTORING.md) — Master Blueprint Lowering Pipeline & Master Contracts.
- [**`docs/architecture/ZOD_TIER_GENERATOR_DECOMMISSION_ANALYSIS.md`**](./docs/architecture/ZOD_TIER_GENERATOR_DECOMMISSION_ANALYSIS.md) — Analisis Decommissioning dan Pembersihan Generator Lama.
