# Arsitektur CompilerBridge

## Tujuan

CompilerBridge adalah **lapisan penghubung (Bridge/Adapter)** antara data dari luar compiler dan pipeline compiler internal.

**Tanggung jawab utama:**
- Menerjemahkan struktur data eksternal (manifest) menjadi Artifact yang dipahami oleh compiler
- Bertindak sebagai **Anti-Corruption Layer** untuk melindungi compiler dari format data eksternal

**CompilerBridge BUKAN bagian dari compiler** dan tidak boleh berisi logika compiler.

---

## Tanggung Jawab

### ✅ CompilerBridge BOLEH:

1. **Mengubah format data eksternal menjadi Compiler Artifact**
   ```typescript
   // ✅ GOOD: Translation saja
   manifestToSemanticTypes(manifest: Manifest): SemanticTypesArtifact {
       return new SemanticTypesArtifact(
           this.translateManifestTypes(manifest)
       )
   }
   ```

2. **Melakukan normalisasi sederhana**
   ```typescript
   // ✅ GOOD: Simple transformation
   toCamelCase(snake_case_name: string): string
   flattenNestedObject(obj: NestedStructure): FlatStructure
   ```

3. **Menjalankan Compiler Pass**
   ```typescript
   // ✅ GOOD: Orchestration saja
   async run(): Promise<GeneratedTypeScriptArtifact> {
       const semanticArtifact = this.manifestToSemanticTypes()
       const state = new CompilationState()
       await this.passManager.execute(state)
       return state.artifacts.get(ArtifactKey)
   }
   ```

4. **Mengembalikan hasil Compiler Pass**
   ```typescript
   // ✅ GOOD: Return artifact
   return generatedArtifact
   ```

### ❌ CompilerBridge TIDAK BOLEH:

1. **Melakukan parsing**
   ```typescript
   // ❌ BAD: Parsing logic di Bridge
   parseResourceClass(phpCode: string): ResourceInfo {
       const ast = phpParser.parse(phpCode)
       return this.extractResourceInfo(ast)
   }
   ```

2. **Melakukan semantic analysis**
   ```typescript
   // ❌ BAD: Semantic logic di Bridge
   inferResponseType(controller: Controller): SemanticType {
       if (this.usesResourceCollection()) {
           return this.buildCollectionType()
       }
   }
   ```

3. **Melakukan type inference**
   ```typescript
   // ❌ BAD: Type inference di Bridge
   resolveTypeFromResource(resource: Resource): SemanticType {
       const modelType = this.findModelForResource(resource)
       return this.applyTypeConstraints(modelType)
   }
   ```

4. **Melakukan constraint solving**
   ```typescript
   // ❌ BAD: Constraint solving di Bridge
   validateTypeCompatibility(a: Type, b: Type): boolean {
       return this.typeEnvironment.unify(a, b)
   }
   ```

5. **Melakukan optimasi**
   ```typescript
   // ❌ BAD: Optimization di Bridge
   optimizeTypeDefinitions(types: Type[]): Type[] {
       return this.eliminateDuplicates(types)
   }
   ```

6. **Menghasilkan kode secara langsung**
   ```typescript
   // ❌ BAD: Code generation di Bridge
   generateTypeScriptInterface(type: Type): string {
       return `interface ${type.name} { ... }`
   }
   ```

7. **Menyimpan business logic compiler**
   ```typescript
   // ❌ BAD: Compiler logic di Bridge
   private determineTypeStrategy(field: Field): Strategy {
       if (field.isPrimitive) return new PrimitiveStrategy()
       if (field.isObject) return new ObjectStrategy()
       // Complex logic yang seharusnya di Pass
   }
   ```

---

## Prinsip Desain

### Anti-Corruption Layer Pattern

Selalu anggap CompilerBridge sebagai **Anti-Corruption Layer**:

```
Data Eksternal (Manifest)
        ↓
  CompilerBridge (Translation)
        ↓
 Compiler Artifact (Clean)
        ↓
   Compiler Pass (Pure)
        ↓
Generated Artifact (Output)
```

**Aturan emas:**
- Jangan pernah membiarkan **Compiler Pass** mengetahui format data eksternal
- Jangan pernah membiarkan **data eksternal** masuk langsung ke Generator

---

## Aturan Lowering (Normalisasi)

### Normalisasi Sederhana DIPERBOLEHKAN:

```typescript
// ✅ GOOD: Simple name transformation
snake_case → camelCase

// ✅ GOOD: Structure flattening
Nested Object:
  shipping.address.city
     ↓
Flattened:
  shippingAddressCity
```

### Batasan Lowering:

**Flattening hanya boleh mengubah struktur data.**

```typescript
// ✅ GOOD: Pure transformation
{
  user: {
    name: 'string',
    email: 'string'
  }
}
// →
{
  userName: 'string',
  userEmail: 'string'
}
```

**Flattening TIDAK BOLEH melakukan semantic analysis:**

```typescript
// ❌ BAD: Semantic analysis di flattening
function flattenWithTypeInference(obj) {
    // Jangan lakukan type inference
    // Jangan resolve dependencies
    // Jangan validate constraints
}
```

---

## Aturan Mapping

### Konversi Tipe Harus Ter-centralized

**Jangan** membuat banyak fungsi konversi yang tersebar:

```typescript
// ❌ BAD: Multiple conversion functions
sqlToSemanticType()
primitiveToSemanticType()
manifestToSemanticType()
phpTypeToSemanticType()
// ... dll
```

**Gunakan** satu Factory yang bertanggung jawab:

```typescript
// ✅ GOOD: Single responsibility factory
class PrimitiveTypeFactory {
    static fromString(typeStr: string): SemanticType
    static fromSQLType(sqlType: SQLType): SemanticType
    static fromPHPType(phpType: PHPType): SemanticType
}

// Usage di Bridge
const semanticType = PrimitiveTypeFactory.fromString(manifestType)
```

---

## Organisasi Kode

### Struktur yang Lebih Baik:

```
CompilerBridge
    ↓
ManifestLowering (Translate manifest structure)
    ↓
ResourceLowering (Flatten nested resources)
    ↓
PrimitiveTypeFactory (Convert primitive types)
    ↓
PassRunner (Execute compiler passes)
    ↓
OutputFormatter (Format final output)
```

### Struktur yang Buruk:

```
CompilerBridge
    ↓
[Semua proses di satu class]
    - Parse
    - Analyze
    - Transform
    - Generate
    - Format
```

---

## Prinsip SRP (Single Responsibility)

### Red Flag: Method dengan Terlalu Banyak Tanggung Jawab

Jika sebuah method mulai melakukan:
- ❌ Mapping tipe
- ❌ Membuat ObjectType
- ❌ Melakukan flattening
- ❌ Menjalankan pass
- ❌ Memformat output

**Maka method tersebut sudah memiliki terlalu banyak tanggung jawab** dan perlu dipecah.

### Solusi: Extract to Dedicated Components

```typescript
// ❌ BAD: God method
manifestToTypes(manifest: Manifest): TypeScriptCode {
    const types = this.mapTypes(manifest)        // Responsibility 1
    const flattened = this.flatten(types)        // Responsibility 2
    const generated = this.generate(flattened)   // Responsibility 3
    return this.format(generated)                // Responsibility 4
}

// ✅ GOOD: Separated responsibilities
class ManifestMapper {
    map(manifest: Manifest): MappedTypes
}
class ResourceFlattener {
    flatten(types: MappedTypes): FlattenedTypes
}
class TypeGenerator {
    generate(types: FlattenedTypes): GeneratedCode
}
```

---

## Sebelum Menulis Kode

### Checklist Pertanyaan:

Sebelum menambahkan logic ke CompilerBridge, tanyakan:

1. **Apakah ini hanya translasi data?** → ✅ Boleh di Bridge
2. **Apakah ini proses lowering?** → ✅ Boleh di Bridge (jika sederhana)
3. **Apakah ini semantic analysis?** → ❌ Harus di Pass
4. **Apakah ini code generation?** → ❌ Harus di Generator/Emitter

**Aturan:**
- Jika jawabannya selain nomor 1-2, maka logika tersebut **TIDAK BOLEH** berada di CompilerBridge

---

## Pola Desain yang Digunakan

### ✅ Gunakan:

- **Adapter Pattern**: Adapt external format to internal format
- **Bridge Pattern**: Separate abstraction from implementation
- **Anti-Corruption Layer**: Protect domain from external formats
- **Immutable Object**: Artifacts are immutable after creation
- **Small Transformation Pass**: Each pass does one thing well

### ❌ Hindari:

- **God Object**: One class doing everything
- **Utility Class raksasa**: 1000+ lines of static methods
- **Business Logic di Bridge**: Keep bridge thin
- **Compiler bergantung pada framework**: Compiler harus framework-agnostic
- **Generator melakukan analisis data**: Generator receives analyzed data

---

## Standar Review

### Checklist saat Review CompilerBridge:

#### 1. **Apakah hanya menerjemahkan data?**
```typescript
// ✅ PASS: Pure translation
manifestToArtifact(manifest): Artifact

// ❌ FAIL: Doing analysis
manifestToArtifact(manifest) {
    // Type inference logic
    // Semantic resolution
    // Constraint solving
}
```

#### 2. **Apakah tidak mengandung business logic?**
```typescript
// ✅ PASS: No business logic
toCamelCase(name)

// ❌ FAIL: Has business logic
determineOptimalTypeStrategy(field) {
    if (field.isComplex) { /* business decision */ }
}
```

#### 3. **Apakah tidak melakukan semantic analysis?**
```typescript
// ✅ PASS: No analysis
flattenObject(obj)

// ❌ FAIL: Semantic analysis
inferTypeRelationships(types) {
    // Analyzing type dependencies
    // Resolving references
}
```

#### 4. **Apakah mudah diganti jika format input berubah?**
```typescript
// ✅ PASS: Easy to change
interface IManifestAdapter {
    adapt(input: unknown): Artifact
}

// ❌ FAIL: Tightly coupled
// Hard-coded manifest structure everywhere
```

#### 5. **Apakah Compiler tetap independen dari framework?**
```typescript
// ✅ PASS: Framework agnostic
Pass.run(artifact: Artifact): Artifact

// ❌ FAIL: Framework dependent
Pass.run(laravelManifest: LaravelManifest): Artifact
```

---

## Contoh Real-world: Phase 2 Refactoring

### Masalah yang Ditemukan:

**SEBELUM:**
```typescript
// ❌ BAD: Flattening logic di CompilerBridge (private method)
class CompilerBridge {
    private manifestToSemanticTypes(manifest: Manifest) {
        // Complex flattening logic di sini
        // Tidak bisa di-test secara independen
        // Tight coupling dengan CompilerBridge architecture
    }
}
```

**Masalah:**
- Logic flattening tidak testable
- Tidak bisa digunakan ulang
- Terlalu banyak tanggung jawab di satu class

### Solusi yang Diterapkan:

**SESUDAH:**
```typescript
// ✅ GOOD: Extract to utils (testable, reusable)
// File: packages/cli/src/generators/utils/resource-flattening.ts
export function flattenResourceFields(
    resourceName: string,
    fields: Record<string, ResourceFieldKind>,
    options?: FlatteningOptions
): Map<string, SemanticType> {
    // Pure flattening logic
    // Testable independently
    // No dependency on CompilerBridge
}

// CompilerBridge now just uses the utility
class CompilerBridge {
    private manifestToSemanticTypes(manifest: Manifest) {
        const flattened = flattenResourceFields(
            resourceName,
            fields,
            { maxDepth: 5 }
        )
        return new SemanticTypesArtifact(flattened)
    }
}
```

**Manfaat:**
- ✅ Logic flattening bisa di-test dengan 25 unit tests
- ✅ Reusable di komponen lain jika diperlukan
- ✅ CompilerBridge tetap thin (hanya orchestration)
- ✅ Clear separation of concerns

---

## Summary: Golden Rules

### 3 Aturan Emas CompilerBridge:

1. **Translation Only**
   - Bridge hanya menerjemahkan format data
   - Tidak ada business logic
   - Tidak ada semantic analysis

2. **Thin Layer**
   - Keep bridge as thin as possible
   - Extract complex logic to dedicated utils/passes
   - One responsibility per component

3. **Anti-Corruption**
   - Protect compiler from external formats
   - Compiler Pass never knows about Manifest structure
   - Clean boundary between external and internal

### Jika Ragu, Tanya:

> "Apakah logic ini tentang **menerjemahkan format** atau tentang **memahami semantik**?"

- Jika **menerjemahkan format** → ✅ Boleh di Bridge
- Jika **memahami semantik** → ❌ Harus di Pass/Analyzer

---

## Referensi

- **Evidence-Based Architecture**: `.kiro/steering/evidence-based-architecture.md`
- **Large Codebase Architecture**: `.kiro/steering/large-codebase-architecture.md`
- **Phase 2 Refactoring**: `PHASE_3_DAY_9_PHASE_2_COMPLETE.md`
- **Compiler Bridge Reverse Engineering**: `COMPILER_BRIDGE_REVERSE_ENGINEERING.md`
