# ADR: Target-Agnostic `SemanticTypeResolver` SSOT & Value Object Type Hierarchy

**Status**: LOCKED & APPROVED  
**Date**: 2026-08-29  
**Scope**: `@routesync/core` (Compiler Domain & Passes)  

---

## 1. Context & Architectural Problem

Dalam pipeline compiler RouteSync, downstream passes (`ContractGeneratorPass`, `MapperGeneratorPass`, `TypeScriptGeneratorPass`) sebelumnya melakukan pemeriksaan ad-hoc dan manipulasi langsung terhadap node AST mentah (`ObjectType`, `ReadonlyCollectionType`, `ReferenceType`, dll).

Pendekatan tersebut memicu 3 masalah utama:
1. **Redundansi Kode & Duplikasi Logika**: Setiap pass memimplementasikan logika penelusuran AST dan pembukaan `nullable_wrapper` secara independen.
2. **Degradasi Tipe & Degradasi Informasi**: Informasi identitas domain (seperti nama Laravel JsonResource `OrderDetailResource`) hilang saat di-lower menjadi struktur bertipe anonymous.
3. **Risiko Leak AST & Bypass Resolver**: Ketika resolver mengekspos objek AST mentah (`rawObject`), downstream passes kembali membaca `.annotations` dan `.properties` secara langsung, menggagalkan tujuan Single Source of Truth (SSOT).

---

## 2. Decision & Architectural Principles

Kita menetapkan **Target-Agnostic `SemanticTypeResolver`** sebagai Single Source of Truth (SSOT) dengan 3 aturan keras yang mengikat:

### 🚫 Rule A — No AST Leak
Downstream passes (`MapperGeneratorPass`, `TypeScriptGeneratorPass`, `ContractGeneratorPass`) **HARUS DIBATASI** dari menerima atau mengevaluasi node `ObjectType` mentah, `.annotations`, atau `.metadata`. Seluruh informasi domain diekstrak secara utuh pada **Origin Boundary** di dalam Value Object terstruktur.

### 🚫 Rule B — No Traversal Context Leak
State traversal milik generator downstream (`targetPropKey`, `jsonPath`, `parentPath`, `outputName`) **DILARANG KERAS** dimasukkan ke dalam Value Object `ResolvedSemanticType`. Traversal state dikelola secara terpisah di dalam `TraversalContext` milik masing-masing generator.

### ✅ Rule C — No Semantic Information Loss
Value Object `ResolvedSemanticType` wajib mempertahankan 4 kategori informasi semantik minimum: Identitas Domain (`resourceName`, `typeName`), Klasifikasi Domain (`objectKind`), Topologi Teranyam (*Nested Object Topology*), Topologi Koleksi, Topologi Pembungkus (*Explicit Wrapper Topology*), dan Field-Level Optionality.

---

## 3. Polymorphic Type Hierarchy Contract (`ResolvedSemanticType`)

Seluruh representasi tipe semantik yang dihasilkan oleh `SemanticTypeResolver` dibagi menjadi 6 Type Families yang **Immutable** (`Object.freeze(this)`):

```
ResolvedSemanticType (Base Immutable Value Object)
 │
 ├── Atomic Types
 │   ├── ResolvedPrimitiveType (kind: 'primitive', primitiveKind: PrimitiveKind)
 │   ├── ResolvedReferenceType (kind: 'reference', name: string)
 │   └── ResolvedUnknownType   (kind: 'unknown')
 │
 ├── Object Type
 │   └── ResolvedObjectType    (kind: 'object', objectKind: ObjectKind, resourceName?: string, typeName?: string, fields: readonly ResolvedField[])
 │
 ├── Wrapper Nodes
 │   ├── ResolvedNullableType   (kind: 'nullable', innerType: ResolvedSemanticType)
 │   └── ResolvedCollectionType (kind: 'collection', elementType: ResolvedSemanticType)
 │
 └── Composite Types
     ├── ResolvedUnionType        (kind: 'union', members: readonly ResolvedSemanticType[])
     └── ResolvedIntersectionType (kind: 'intersection', members: readonly ResolvedSemanticType[])
```

---

## 4. Locked Refinements: Nullable vs Optional

1. **`nullable` (Type-Level Wrapper Node)**:
   - Nullability diwakili secara eksplisit oleh wrapper node `ResolvedNullableType`. `nullable: boolean` **TIDAK TERDAPAT** sebagai properti pada `ResolvedObjectType`.
   - Contoh: `User[] | null` ➔ `Nullable(Collection(Object(User)))`.
   - Contoh: `(User | null)[]` ➔ `Collection(Union(Object(User), Nullable(Object(User))))`.

2. **`optional` (Field-Level Attribute)**:
   - Optionality diwakili pada level properti `ResolvedField`:
     ```typescript
     export type ResolvedField = readonly [
         name: string,
         type: ResolvedSemanticType,
         optional?: boolean
     ];
     ```
   - Contoh: `user?: User | null` ➔ `ResolvedField('user', Nullable(Object(User)), optional: true)`.

---

## 5. Downstream Execution Contract (Resolve Once ➔ Consume Everywhere)

```
                    IR / AST
                       │
                       ▼
              Semantic Resolver
                       │
                       ▼
          ResolvedSemanticType Tree
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    Contract         Mapper       TypeScript
     Lowerer         Lowerer        Lowerer
```

Downstream passes mengonsumsi `ResolvedSemanticType` murni melalui pattern matching terhadap discriminator `kind` dan `objectKind`:
- `kind === 'nullable'` ➔ unwrap `innerType`
- `kind === 'collection'` ➔ unwrap `elementType`
- `kind === 'object'` ➔ baca `objectKind` (`resource` | `model` | `response` | `plain`) dan `resourceName`

---

## 6. Implementation Workflow & Verification Steps

1. **Phase 1: Test Plan Creation** (TDD Vocabulary, Constructor Invariants, Recursive Topology, Metadata Preservation).
2. **Phase 2: Core Domain Value Objects Refactoring** (`ResolvedSemanticType.ts`, `ConversionResult.ts`, `SemanticTypeResolver.ts`).
3. **Phase 3: Pass Integration & Verification** (`TypeScriptGeneratorPass.ts`, `MapperGeneratorPass.ts`, `ResponseFieldLowering.ts`).
4. **Phase 4: Monorepo Build & Full SDK Test Suite Verification** (`packages/sdk` Vitest suite 100% GREEN).
