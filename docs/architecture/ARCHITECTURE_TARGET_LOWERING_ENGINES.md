# Target Lowering Engines Architecture

**Status**: Approved & Locked  
**Date**: 2026-08-29  
**Scope**: `@routesync/core` (Compiler Domain & Lowering Engines)  

---

## 1. Architectural Model: Semantic Engine vs Target Lowering Engines

RouteSync compiler terbagi secara tegas menjadi 2 jenis engine terpisah:

```
                            Semantic IR / AST
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       SHARED SEMANTIC ENGINE                            │
│                                                                         │
│  SemanticTypeResolver                                                   │
│  ResolvedSemanticType (Value Object Hierarchy)                          │
│  Preserves: Identity, Classification, Topology, Modifiers              │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ (Resolve Once)
                                    ▼
                          ResolvedSemanticType
                           (Shared Meaning)
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
TypeScriptTypeLowerer       ZodSchemaLowerer                MapperLowerer
(Layer 3: TS Syntax)        (Layer 3: Zod Schema)           (Layer 3: Mapping Code)
    │                               │                               │
    ├─► api-read.ts                 ├─► api-contract.ts             └─► api-mapper.ts
    ├─► api-form.ts                 └─► validators
    └─► sdk/hooks.ts
```

---

## 2. Invariants & Strict Boundaries

> [!IMPORTANT]
> **1. Anti-Pattern Warning: No God Lowerer**  
> Setiap Target Lowering Engine bertindak secara spesifik pada bahasa/framework targetnya. `TypeScriptTypeLowerer` HANYA menangani sintaks TypeScript. `ZodSchemaLowerer` HANYA menangani schema Zod. Tidak boleh menggabungkan logika Zod atau Mapper ke dalam `TypeScriptTypeLowerer`.
> 
> **2. Reuse Berdasarkan Kebutuhan Domain**  
> Lowering Engine dikonsumsi oleh Compiler Pass berdasarkan kebutuhan target output pass tersebut:
> - `TypeScriptGeneratorPass` ➔ `TypeScriptTypeLowerer`
> - `ContractGeneratorPass` ➔ `ZodSchemaLowerer`
> - `MapperGeneratorPass` ➔ `MapperLowerer` + `MapperTraversalContext`
> - `FormGeneratorPass` ➔ `ZodSchemaLowerer` / `TypeScriptTypeLowerer`

---

## 3. Scalability Model untuk Lowering Engines Masa Depan

Bila RouteSync menambahkan target generator baru di masa depan (misalnya OpenAPI, Rust DTO, atau Laravel DTO), **Semantic Engine tidak perlu diubah**. Cukup buat Lowering Engine baru yang menerima `ResolvedSemanticType`:

```
ResolvedSemanticType
        │
        ├── TypeScriptTypeLowerer (Existing)
        ├── ZodSchemaLowerer      (Tahap 5)
        ├── MapperLowerer         (Existing)
        ├── OpenApiLowerer        (Future)
        └── RustDTOLowerer        (Future)
```
