# Form Lowering Contract Audit (Tahap 6 Design)

**Status**: Approved & Migrating  
**Date**: 2026-08-29  
**Scope**: `@routesync/core` (`FormGeneratorPass.ts` & `FormActionGenerator.ts`)  

---

## 1. 3-Layer Architecture Model for Form Lowering

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
  Mapper Lowering   TS Lowering    Form Lowering
     (Layer 3)       (Layer 3)       (Layer 6 - Tahap 6)
       │                │                │
       ▼                ▼                ▼
  api-mapper.ts     api-read.ts      api-form.ts
                                  (consumes TypeScriptTypeLowerer)
```

---

## 2. Form Action Payload Types Contract

Form Generator bertugas menghasilkan tipe payload TypeScript untuk setiap aksi Form (`create`, `update`):

1. **Primitive & File Constraints**:
   - `file` ➔ `File`
   - `datetime` ➔ `string`
2. **Field Optionality vs Nullability**:
   - Required & non-nullable: `name: string`
   - Required & nullable: `name: string | null`
   - Optional & non-nullable: `name?: string`
   - Optional & nullable: `name?: string | null`
3. **Reusable Lowering Engine**:
   - `FormActionGenerator.ts` mengonsumsi `SemanticTypeResolver` SSOT dan `TypeScriptTypeLowerer` (`toTypeScriptTypeExpression`) untuk menghasilkan tipe properti form yang 100% konsisten dengan `api-read.ts`.

---

## 3. Invariant Verification

- [ ] Eliminasi seluruh `type.kind === 'primitive'`, `'object'`, `'readonly_collection'` checks manual di `FormActionGenerator.ts`.
- [ ] Mengganti seluruh konversi tipe manual dengan `toTypeScriptTypeExpression(resolver.resolve(field.type))`.
- [ ] Preservasi 100% behavior pada test suite existing.
