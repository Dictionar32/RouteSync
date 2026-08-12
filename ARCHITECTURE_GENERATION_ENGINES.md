# Peta Arsitektur — Dua Jalur Engine Generate RouteSync

**Tanggal:** 2026-08-12
**Tujuan:** Memetakan dua jalur generate SDK yang hidup paralel di RouteSync, komponen penyusunnya, dan ke mana masing-masing menulis output.

---

## Ringkasan

RouteSync punya **dua jalur generate** yang keduanya aktif dan menghasilkan
file ke folder yang bisa tumpang tindih:

| | **Jalur A — `generate`** | **Jalur B — `generate-v2`** |
|---|---|---|
| CLI command | `routesync generate` | `routesync generate-v2` |
| Orkestrator | `CompilerBridge` | `ContractGenerator` |
| Arsitektur | Hybrid (baru + lama) | Contract IR (Semantic IR → Declaration IR → Thin Emitters) |
| Jumlah file | 21 | 7 |
| Contoh output dir | `frontend/src/api/` | `frontend/src/api-compiler/` |

> ⚠️ Istilah "engine lama" vs "engine baru" sering dipakai, tapi **menyesatkan**:
> Jalur A berisi komponen yang dibuat belakangan (`ContractCodeBuilder`,
> `ContractGeneratorPass` — commit `052d75a`/`b47fb42`) dan komponen lama
> (`ZodTierGenerator`, `HookGenerator`). Yang membedakan kedua jalur adalah
> **arkitekturnya**, bukan umur komponennya.

---

## Jalur A — `generate` (Hybrid)

```
CLI generate (packages/cli/src/commands/generate.ts)
│
├─▶ CompilerBridge.generateTypeScript()          ← packages/cli/src/generators/CompilerBridge.ts (293 baris, orkestrasi)
│     ├─ manifestToSemanticTypes()               ← utils/manifest-to-types.ts (567 baris, lowering)
│     └─▶ TypeScriptGeneratorPass                 ← packages/core/src/compiler/passes/
│           └─▶ types/api-read.ts (via pass naming convention)
│
├─▶ CompilerBridge.generateFormTypes()
│     ├─ manifestToRequestTypes()                 ← utils/manifest-to-types.ts
│     └─▶ FormGeneratorPass
│           └─▶ forms/...
│
├─▶ CompilerBridge.generateContractTypes()       ← 🔑 contract-generation/
│     ├─ manifestToContractInput()                ← utils/manifest-to-types.ts (preserve snake_case + nested)
│     └─▶ ContractGeneratorPass                   ← packages/core/src/compiler/passes/ContractGeneratorPass.ts
│           ├─▶ ContractSchemaMapper              ← packages/core/src/compiler/generators/contract-generation/
│           ├─▶ ContractActionGenerator           ←   (folder ini dipanggil DARI ContractGeneratorPass)
│           ├─▶ ContractCodeBuilder               ←   → contract/api-contract.ts
│           └─▶ ResponseActionBuilder / ResponseFieldParser / ResponseSchemaMapper
│
├─▶ ZodTierGenerator                              ← packages/cli/src/generators/ZodTierGenerator.ts (komponen lama)
│     └─▶ contract/api-schema.ts (48 payload schemas), contract/api-field.ts, types/, mappers/
│
└─▶ HookGenerator                                 ← packages/cli/src/generators/HookGenerator.ts (komponen lama)
      └─▶ hooks.ts (React Query), actions.ts, query-key.ts
```

**Kata kunci:** `contract-generation/` **hanya** dipanggil oleh
`ContractGeneratorPass`, yang dipanggil **hanya** oleh
`CompilerBridge.generateContractTypes()`, yang dipanggil **hanya** oleh CLI
`generate`.

**Keunggulan jalur A:** lengkap untuk produksi — hooks, actions, payload
schemas, model schemas, semuanya ada (21 file).

---

## Jalur B — `generate-v2` (Contract IR)

```
CLI generate-v2
│
└─▶ ContractGenerator                              ← packages/cli/src/generators/ContractGenerator.ts
      ├─ ManifestEnricher.enrich()                ← layers/utils/manifest-enricher.ts
      │     (infer resources + models dari route responses)
      ├─ adaptManifest()                          ← route → ParsedResource/ParsedRequest/ParsedRoute
      │     (buildRequestsFromRoutes: POST → Create, PUT/PATCH → Update → payload schemas)
      ├─▶ OptimizedContractIRBuilder               ← packages/core/src/ir/ContractIRBuilder.ts
      │     (ContractIR: resources, requests, endpoints, mapper, variants)
      └─▶ 7 emitters                               ← packages/cli/src/generators/layers/
            ├─ ReadEmitter        → types/api-read.ts
            ├─ FormEmitter        → forms/api-form.ts
            ├─ SchemaEmitter      → schemas/api-schema.ts (ApiSchema/ApiFormValues/ApiDefaultValues)
            ├─ ContractEmitter    → contract/api-contract.ts (Zod schemas + validators)
            ├─ FieldEmitter       → contract/api-field.ts (ApiApiField)
            ├─ MapperEmitter      → mappers/api-mapper.ts
            └─ SDKEmitter         → sdk/api.ts
```

**Kata kunci:** jalur B **tidak** menyentuh `contract-generation/` sama sekali —
pembuatan kontraknya lewat `layers/ContractEmitter` yang consume
`ContractIR` (pure renderer dari TypeIR).

---

## Tiga Mesin `api-contract` — dua di jalur A, satu di jalur B

Ini sumber utama kebingungan — **tiga implementasi berbeda** menghasilkan
file bernama `api-contract.ts` di tiga lokasi berbeda:

| | Jalur A — `ContractCodeBuilder` | Jalur A — `ZodTierGenerator` | Jalur B — `ContractEmitter` |
|---|---|---|---|
| Lokasi kode | `packages/core/src/compiler/generators/contract-generation/` | `packages/cli/src/generators/ZodTierGenerator.ts` | `packages/cli/src/generators/layers/ContractEmitter.ts` |
| Dipanggil oleh | `ContractGeneratorPass` ← `CompilerBridge.generateContractTypes()` | CLI `generate` (langsung, jika `--zod`) | `ContractGenerator` (generate-v2) |
| **Output file** | `frontend/src/api/**contracts**/api-contract.ts` (plural) | `frontend/src/api/**contract**/api-contract.ts` (singular) | `frontend/src/api-compiler/**contract**/api-contract.ts` |
| Model schemas | ❌ tidak ada (resource + request contracts saja) | ✅ ada (20 model dari `manifest.models`) | ❌ tidak ada (resources dari IR) |
| Format nama | `orderResourceShowSchema`, `registerContractSchema`, `ContractSchemas` registry | `OrderSchema` + `RegisterCreatePayloadSchema` + `validateX` | `OrderResourceSchema` + `RegisterCreatePayload` + `validateX` |
| Case | camelCase | snake_case (backend asli) | snake_case (backend asli) |

> ⚠️ **Tidak saling menimpa** — `contracts/` (plural) vs `contract/` (singular)
> adalah folder berbeda. Tapi namanya mirip, jadi mudah tertukar saat
> membaca output.

> ⚠️ Urutan eksekusi di `generate.ts`: `ContractCodeBuilder` (via
> CompilerBridge) jalan lebih dulu menulis `contracts/`, lalu `ZodTierGenerator`
> menulis `contract/`. Keduanya hidup berdampingan di folder output yang sama.

---

## Peta Folder Kunci

```
packages/
├── cli/src/generators/
│   ├── CompilerBridge.ts            ← orkestrator jalur A (293 baris)
│   ├── ContractGenerator.ts         ← orkestrator jalur B
│   ├── layers/                      ← emitters jalur B (ContractEmitter, ReadEmitter, ...)
│   ├── utils/
│   │   ├── manifest-to-types.ts     ← lowering jalur A (567 baris)
│   │   ├── resource-flattening.ts
│   │   └── PrimitiveTypeFactory.ts
│   ├── ZodTierGenerator.ts          ← komponen lama jalur A
│   └── HookGenerator.ts             ← komponen lama jalur A
└── core/src/
    ├── compiler/
    │   ├── passes/
    │   │   ├── ContractGeneratorPass.ts   ← pemanggil contract-generation/
    │   │   ├── TypeScriptGeneratorPass.ts
    │   │   └── FormGeneratorPass.ts
    │   └── generators/contract-generation/ ← ContractCodeBuilder, ContractActionGenerator,
    │                                          ResponseActionBuilder, ResponseFieldParser,
    │                                          ContractSchemaMapper, ResponseSchemaMapper
    └── ir/
        └── ContractIRBuilder.ts     ← OptimizedContractIRBuilder (jalur B)
```

---

## Implikasi / Catatan

1. **Dua jalur bisa dipakai paralel** — output ke folder berbeda; kalau ke
   folder sama, file dengan nama sama akan saling menimpa (format beda).
2. **Perbaikan harus tahu jalurnya**: fix `contract-generation/` (mis.
   ResponseActionBuilder) hanya memengaruhi `contracts/api-contract.ts` di
   jalur A; fix `layers/ContractEmitter` hanya memengaruhi jalur B; fix
   `ZodTierGenerator` hanya memengaruhi `contract/api-contract.ts` jalur A.
3. **Gap jalur B saat ini:** belum ada hooks/actions (HookGenerator/NextActionGenerator
   hanya di jalur A). Gap jalur A: ZodTierGenerator vs SchemaEmitter duplikasi
   form schemas.
4. **Quirk yang perlu ditelusuri:** di `contracts/api-contract.ts`, nested
   resource di-resolve `z.unknown()` (`items`, `gateway`, ...) dan
   `RegisterResponseSchema` muncul dua kali di `contract/api-contract.ts`
   (self-reference) — kandidat bug yang terdokumentasi di
   `API_CONTRACT_KNOWN_LIMITATIONS.md`.
5. **Dokumen terkait:** `ANALISA_RESPONSE_ACTION_BUILDER_TESTS.md` (analisa error
   TS di `contract-generation/`), `ENGINE.Fix.md`, `API_CONTRACT_GENERATION_COMPLETE.md`.
