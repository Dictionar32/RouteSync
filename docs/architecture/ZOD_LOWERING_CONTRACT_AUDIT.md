# Zod Schema Lowering Contract Audit (Tahap 5 Design)

**Status**: Draft / Audit Contract Design  
**Date**: 2026-08-29  
**Scope**: `@routesync/core` (`ContractGeneratorPass.ts` & `ZodSchemaLowerer.ts`)  

---

## 1. 3-Layer Architecture Model for Zod Lowering

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
  Mapper Lowering   TS Lowering    Zod Schema Lowering
     (Layer 3)       (Layer 3)        (Layer 5 - Tahap 5)
       │                │                │
       ▼                ▼                ▼
  api-mapper.ts     api-read.ts    api-contract.ts
```

---

## 2. Zod Schema Lowering Mapping Contract

Di bawah ini adalah matriks pemetaan eksak dari 8 kelas `ResolvedSemanticType` ke ekspresi sintaks Zod Schema (`z.X`):

| Resolved Value Object Node | Discriminator (`resolved.kind`) | Parameter Semantik | Hasil String Sintaks Zod Schema (`toZodSchemaExpression`) |
|---|---|---|---|
| `ResolvedPrimitiveType` | `'primitive'` | `primitiveKind = 'string'` | `'z.string()'` |
| | | `primitiveKind = 'number'` | `'z.number()'` |
| | | `primitiveKind = 'boolean'` | `'z.boolean()'` |
| | | `primitiveKind = 'datetime'` | `'z.string().datetime()'` (atau `'z.string()'`) |
| | | `primitiveKind = 'file'` | `'z.custom<File>()'` |
| `ResolvedReferenceType` | `'reference'` | `name` | `z.lazy(() => ${resolved.name}Schema)` |
| `ResolvedObjectType` | `'object'` | `fields.length === 0` | `'z.object({})'` |
| | | `fields.length > 0` | `z.object({\n  ${fieldLines}\n})` (dengan `field.optional ? '.optional()' : ''`) |
| `ResolvedNullableType` | `'nullable'` | `innerType` | `z.nullable(${toZodSchemaExpression(innerType)})` (atau `.nullable()`) |
| `ResolvedCollectionType` | `'collection'` | `elementType` | `z.array(${toZodSchemaExpression(elementType)})` |
| `ResolvedUnionType` | `'union'` | `members` | `z.union([${members.map(toZodSchemaExpression).join(', ')}])` |
| `ResolvedIntersectionType` | `'intersection'` | `members` | `${toZodSchemaExpression(m1)}.and(${toZodSchemaExpression(m2)})` |
| `ResolvedUnknownType` | `'unknown'` | - | `'z.unknown()'` |

---

## 3. Field Optionality vs Nullability Invariant

- **`optional` (Field Attribute)**:
  - `ResolvedField('name', Primitive('string'), optional: true)` ➔ `name: z.string().optional()`
- **`nullable` (Type Wrapper Node)**:
  - `ResolvedNullableType(Primitive('string'))` ➔ `z.nullable(z.string())` (atau `z.string().nullable()`)
- **Combined (`user?: string | null`)**:
  - `ResolvedField('user', Nullable(Primitive('string')), optional: true)` ➔ `user: z.string().nullable().optional()`

---

## 4. Top-Level Contract Schema & Validator Declaration Rules

Untuk setiap `RequestType` atau `Contract`:
1. Ekspor konstanta schema Zod:
   ```typescript
   export const OrderResourceContractSchema = z.object({ ... });
   ```
2. Ekspor inferensi tipe Zod:
   ```typescript
   export type OrderResourceContract = z.infer<typeof OrderResourceContractSchema>;
   ```
3. Ekspor fungsi validator jika ada action:
   ```typescript
   export const validateOrderResourceCreate = (data: unknown) => OrderResourceContractSchema.parse(data);
   ```

---

## 5. Audit Invariant Check Before Code Refactoring

- [ ] `ZodSchemaLowerer` HANYA menangani sintaks Zod Schema (Rule A: No AST Leak).
- [ ] Isolation dari state traversal (Rule B: No Traversal Context Leak).
- [ ] Preservasi lengkap topologi wrapper `Nullable(Collection(X))` vs `Collection(Nullable(X))` (Rule C).
