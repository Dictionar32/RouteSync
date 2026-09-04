# Test Plan: Target-Agnostic `SemanticTypeResolver` & Value Object Hierarchy

**Target Component**: `@routesync/core` (Domain Common & Compiler Passes)  
**Status**: Ready for Execution  
**Reference ADR**: [`docs/architecture/ADR_SEMANTIC_TYPE_RESOLVER_SSOT.md`](file:///home/annas-zen/Documents/RouteSync/docs/architecture/ADR_SEMANTIC_TYPE_RESOLVER_SSOT.md)  

---

## 🎯 Strategic Test Goal

Memastikan bahwa pembaruan ke `SemanticTypeResolver` SSOT dan `ResolvedSemanticType` Value Objects bekerja secara deterministik 100% tanpa ada kebocoran AST, tanpa ada kebocoran state traversal, dan tanpa ada degradasi informasi semantik.

---

## 🧪 Test Suite Structure

### Suite 1: Hierarchy & Constructor Invariants
**Goal**: Verifikasi bahwa setiap Value Object bersifat immutable, memiliki discriminator `kind` yang presisi, dan memisahkan `optional` pada `ResolvedField` dari `ResolvedNullableType`.

- [ ] **Test 1.1: Object Immutability Invariant**  
  Setiap instance `ResolvedSemanticType` yang diinstansiasi wajib ter-freeze (`Object.isFrozen(instance) === true`).
- [ ] **Test 1.2: Discriminator Kind Mapping Across 6 Families**  
  `ResolvedPrimitiveType` (`kind = 'primitive'`), `ResolvedReferenceType` (`kind = 'reference'`), `ResolvedObjectType` (`kind = 'object'`), `ResolvedNullableType` (`kind = 'nullable'`), `ResolvedCollectionType` (`kind = 'collection'`), `ResolvedUnionType` (`kind = 'union'`), `ResolvedIntersectionType` (`kind = 'intersection'`), `ResolvedUnknownType` (`kind = 'unknown'`).
- [ ] **Test 1.3: Separation of Nullable Wrapper vs Field Optionality**  
  - Field `user?: User | null` ter-resolve sebagai `ResolvedField('user', Nullable(Object(User)), optional: true)`.
  - Field `user: User | null` ter-resolve sebagai `ResolvedField('user', Nullable(Object(User)), optional: false)`.
- [ ] **Test 1.4: ConversionResult Singleton Immutability**  
  `ConversionResult.EMPTY_FIELDS` dan `ConversionResult.EMPTY_WARNINGS` ter-freeze dan aman dikonsumsi lintas pass.

---

### Suite 2: Recursive Topology & Wrapper Order
**Goal**: Verifikasi bahwa urutan wrapper node (`Nullable` vs `Collection`) mempertahankan makna semantik tanpa perataan topologi.

- [ ] **Test 2.1: Outer Nullable Collection (`User[] | null`)**  
  AST `User[] | null` ter-resolve presisi sebagai:  
  `ResolvedNullableType ➔ ResolvedCollectionType ➔ ResolvedObjectType('User')`.
- [ ] **Test 2.2: Array of Nullable Elements (`(User | null)[]`)**  
  AST `(User | null)[]` ter-resolve presisi sebagai:  
  `ResolvedCollectionType ➔ ResolvedNullableType ➔ ResolvedObjectType('User')`.
- [ ] **Test 2.3: Deep Nested Object Topology (`data.user.id`)**  
  Objek bersarang ter-resolve secara rekursif menjadi struktur pohon `ResolvedObjectType` anak tanpa kehilangan kedalaman node.

---

### Suite 3: Domain Metadata & Identity Preservation
**Goal**: Verifikasi bahwa identitas resource dan klasifikasi domain diekstrak di Origin Boundary tanpa `rawObject` atau pembacaan `.annotations` downstream.

- [ ] **Test 3.1: Eloquent JsonResource Identity Extraction**  
  `ObjectType` dengan anotasi `name = 'OrderDetailResource'` ter-resolve menjadi:  
  `ResolvedObjectType` dengan `objectKind = 'resource'` dan `resourceName = 'OrderDetailResource'`.
- [ ] **Test 3.2: Eloquent Model Identity Extraction**  
  `ObjectType` dengan anotasi `name = 'User'` ter-resolve menjadi:  
  `ResolvedObjectType` dengan `objectKind = 'model'` dan `typeName = 'User'`.
- [ ] **Test 3.3: Anonymous DTO / Plain Object Extraction**  
  `ObjectType` tanpa anotasi ter-resolve menjadi:  
  `ResolvedObjectType` dengan `objectKind = 'plain'`.

---

### Suite 4: Pass Lowering & Full Monorepo Integration (Rule 1 & 8)
**Goal**: Verifikasi bahwa `TypeScriptGeneratorPass` dan `MapperGeneratorPass` mengonsumsi `SemanticTypeResolver` SSOT secara 100% GREEN.

- [ ] **Test 4.1: TypeScriptGeneratorPass Baseline Resolution**  
  Seluruh tipe primitif, referensi, koleksi, dan objek ter-generate secara deterministik.
- [ ] **Test 4.2: MapperGeneratorPass Read & Form Mapper Resolution**  
  `toOrderDetailResourceRead` dan `toOrderDetailResourceReadList` ter-generate secara presisi untuk koleksi resource (`items`).
- [ ] **Test 4.3: Full SDK Integration Suite (Vitest)**  
  Menjalankan `npx vitest run --reporter=verbose` di `packages/sdk` dengan target **42 / 42 test files passed, 185 / 185 tests GREEN**.
- [ ] **Test 4.4: Monorepo Build Verification**  
  Menjalankan `npm run build` dengan hasil **0 errors**.
