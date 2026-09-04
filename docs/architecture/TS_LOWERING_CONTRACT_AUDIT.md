# TypeScript Lowering Contract Audit (Tahap 4 Design)

**Status**: Draft / Audit Contract Design  
**Date**: 2026-08-29  
**Scope**: `@routesync/core` (`TypeScriptGeneratorPass.ts` & `TypeScriptGenerator.ts`)  

---

## 1. 3-Layer Architecture Model

```
                 ORIGIN (Layer 1)
                        │
                        ▼
                 Raw Semantic IR
                        │
                        ▼
┌────────────────────────────────────────────────┐
│            SEMANTIC ENGINE (Layer 2)           │
│                                                │
│  SemanticTypeResolver                          │
│  ResolvedSemanticType Value Object hierarchy   │
│  Identity / Topology / Metadata Preservation   │
└───────────────────────┬────────────────────────┘
                        │ (Resolve once)
                        ▼
               ResolvedSemanticType
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
  Mapper Lowering   TS Lowering   Contract Lowering
     (Layer 3)       (Layer 3)        (Layer 3)
       │                │                │
       ▼                ▼                ▼
  api-mapper.ts     api-read.ts    api-contract.ts
```

> [!CAUTION]
> **Anti-Pattern Warning: Dilarang "Universal Generator"**  
> `ResolvedSemanticType` mengekspos **Semantic Meaning** yang bersifat universal. Namun, **Target Representation** (TypeScript interface, Zod schema, Mapper function) bersifat spesifik pada Lowering Engine masing-masing. Tidak boleh membuat satu "Universal Type Generator" string yang dikonsumsi oleh seluruh pass.

---

## 2. TypeScript Lowering Mapping Contract

Di bawah ini adalah matriks pemetaan eksak dari 8 kelas `ResolvedSemanticType` ke tipe sintaks TypeScript:

| Resolved Value Object Node | Pattern Matching (`resolved.kind`) | Parameter Semantik | Hasil String Sintaks TypeScript (`toTypeScriptString`) |
|---|---|---|---|
| `ResolvedPrimitiveType` | `'primitive'` | `primitiveKind = 'datetime'` | `'string'` |
| | | `primitiveKind = 'file'` | `'File'` |
| | | `primitiveKind` lainnya | `resolved.primitiveKind` (`'string'`, `'number'`, `'boolean'`, dll) |
| `ResolvedReferenceType` | `'reference'` | `name` | `resolved.name` (misal `'User'`, `'Order'`) |
| `ResolvedObjectType` | `'object'` | `fields.length === 0` | `'object'` |
| | | `fields.length > 0` | `{\n  ${fieldLines}\n}` (dengan `field.optional ? '?:' : ':'`) |
| `ResolvedNullableType` | `'nullable'` | `innerType` | `${toTypeScriptString(innerType)} \| null` |
| `ResolvedCollectionType` | `'collection'` | `elementType` | `${toTypeScriptString(elementType)}[]` |
| `ResolvedUnionType` | `'union'` | `members` | `members.map(toTypeScriptString).join(' \| ')` |
| `ResolvedIntersectionType` | `'intersection'` | `members` | `members.map(toTypeScriptString).join(' & ')` |
| `ResolvedUnknownType` | `'unknown'` | - | `'unknown'` |

---

## 3. Interface Extraction & Naming Rules (Top-Level Objects)

Untuk objek tingkat atas (*top-level object*) yang memerlukan deklarasi `export interface X`:
1. Jika `objectKind === 'resource'`, nama interface menggunakan suffix `Transformed` (misal `OrderDetailResourceTransformed`).
2. Jika `objectKind === 'model'`, nama interface menggunakan nama tipe (misal `UserTransformed`).
3. Jika `typeName` atau `resourceName` tersedia, gunakan identitas domain tersebut. Jika tidak, gunakan `AnonymousInterface`.
4. Jika `objectKind === 'resource'`, buatlah alias tipe otomatis:
   - `export type XShow = XTransformed;`
   - `export type XIndex = XTransformed[];`

---

## 4. Audit Invariant Check Sebelum Refactoring Kode

- [ ] `TypeScriptGeneratorPass` **TIDAK BOLEH** membaca `ObjectType.annotations` atau `properties.entries()`.
- [ ] Field `optional: true` di-render sebagai `key?: T`, sedangkan `ResolvedNullableType` di-render sebagai `key: T | null`.
- [ ] Bebas dari traversal leak (`jsonPath` / `targetPropKey` tidak boleh masuk ke `ResolvedSemanticType`).
