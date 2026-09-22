# Refactoring Plan: Eliminate "Data Bebas" Interfaces

## Problem Statement

RouteSync masih banyak interface dengan pola **"data bebas"**:
- `Record<string, unknown>`
- `Record<string, any>`
- `[key: string]: unknown`
- `unknown[]`
- `any`

**Ini bertentangan** dengan arah arsitektur RouteSync:
> **IR harus membawa informasi downstream, bukan downstream mengorek-ngorek data mentah lagi.**

---

## Anti-Pattern yang Harus Dihindari

### ❌ SALAH: Cuma Ganti Kandang Ayam

```typescript
// BEFORE
interface Something {
    data: Record<string, unknown>;
}

// AFTER (MASIH SALAH!)
interface Something {
    data: Record<string, string>;  // ← Cuma ganti tipe, belum jelas maknanya
}
```

### ✅ BENAR: Cari Makna Sebenarnya

```typescript
// BEFORE
const properties: Record<string, TypeIR> = {};

// AFTER
interface ObjectTypeIR {
    readonly kind: 'object';
    readonly properties: readonly PropertyIR[];
}

interface PropertyIR {
    readonly name: string;
    readonly type: TypeIR;
    readonly optional: boolean;
    readonly nullable: boolean;
}
```

**Sekarang**: Downstream tidak perlu menebak isi `Record`.

---

## Prinsip Inti: Pipeline Data Flow

```
┌────────────────────┐
│ Raw Laravel Input  │ ← Record<string, unknown> BOLEH
└────────────────────┘
          │
          ▼
┌────────────────────┐
│ Boundary Validation│ ← Parse & validate
└────────────────────┘
          │
          ▼
┌────────────────────┐
│ Typed Domain Model │ ← Record<string, unknown> HILANG!
└────────────────────┘
          │
          ▼
┌────────────────────┐
│ Semantic IR        │ ← Discriminated Union ADT
└────────────────────┘
          │
          ▼
┌────────────────────┐
│ Lowerer            │ ← Pure transformation
└────────────────────┘
          │
          ▼
┌────────────────────┐
│ Emitter            │ ← Code generation
└────────────────────┘
```

**Aturan**: Semakin ke kanan (downstream), semakin sedikit `unknown`, `Record`, `any`, dan type guard.

---

## 5 Aturan Baru

### 1. `Record<string, unknown>` Hanya Boleh di Boundary

**BOLEH** (di boundary):
```typescript
// packages/cli/src/parsers/laravelParser.ts
type RawLaravelInput = Record<string, unknown>;  // ← External input

function parseLaravelRoutes(raw: RawLaravelInput): ParsedRoute[] {
    // Validate & transform ke typed model
}
```

**TIDAK BOLEH** (di IR/Domain):
```typescript
// ❌ SALAH di packages/core/src/types/ir/
interface ResourceIR {
    fields: Record<string, unknown>;  // ← Terlalu lemah!
}
```

---

### 2. `unknown` Harus Punya Alasan

**SALAH**:
```typescript
interface ResolutionContext {
    contextModel?: unknown;      // ← "Nanti orang lain yang cari tahu"
    resources: unknown[];        // ← Terlalu lemah
}
```

**BENAR** (Discriminated Union):
```typescript
type ContextModel =
    | ModelIR
    | ResourceIR
    | ResponseIR;

interface ResolutionContext {
    readonly contextModel?: ContextModel;
    readonly resources: readonly ResourceIR[];
}
```

---

### 3. Jangan Gunakan Index Signature untuk Semantic Node

**SALAH**:
```typescript
interface ExpressionNode {
    [key: string]: unknown;  // ← Terlalu bebas!
}
```

**BENAR** (Explicit Discriminated Union):
```typescript
interface ExpressionNode {
    readonly kind: ExpressionKind;
    readonly source: ExpressionSource;
}

type ExpressionNode =
    | VariableExpression
    | PropertyExpression
    | MethodCallExpression
    | LiteralExpression;

interface VariableExpression {
    readonly kind: 'variable';
    readonly name: string;
}

interface PropertyExpression {
    readonly kind: 'property';
    readonly object: ExpressionNode;
    readonly property: string;
}
```

**Keuntungan**: Compiler tahu bentuk datanya **sebelum runtime**.

---

### 4. IR Harus Menjadi "Kamus", Bukan "Tas Plastik"

**SALAH** (Tas Plastik):
```typescript
interface ResourceIR {
    name: string;
    model?: string;
    fields: Record<string, TypeIR>;  // ← Bebas, tidak terstruktur
}
```

**BENAR** (Kamus):
```typescript
interface ResourceIR {
    readonly name: ResourceName;
    readonly model: ModelReference;
    readonly fields: readonly ResourceFieldIR[];
}

interface ResourceFieldIR {
    readonly name: FieldName;
    readonly type: TypeIR;
    readonly optional: boolean;
    readonly nullable: boolean;
}
```

**Dampak di Lowerer**:
```typescript
// SEBELUM: Defensive programming everywhere
function lower(resource: ResourceIR) {
    const fields = resource.fields ?? {};
    for (const key in fields) {
        if (!fields.hasOwnProperty(key)) continue;  // ← Guard
        const type = fields[key];
        if (!type) continue;  // ← Guard
        // ... banyak if lagi
    }
}

// SESUDAH: Zero guards
function lower(resource: ResourceIR) {
    for (const field of resource.fields) {
        // field: ResourceFieldIR (guaranteed complete)
        const tsField = lowerField(field);  // ← Direct transformation
    }
}
```

---

### 5. Kurangi Type Guards di Downstream

**SALAH** (Guard sebagai mekanisme normal compiler):
```typescript
// Di lowerer/generator (DOWNSTREAM!)
function generate(node: unknown) {
    if (isObject(node)) {
        // ...
    } else if (isModelNode(node)) {
        // ...
    } else if (hasKind(node, 'array')) {
        // ...
    }
    // ... 47 type guards lagi
}
```

**BENAR** (Guard hanya di Origin Boundary):
```typescript
// Origin Boundary (UPSTREAM)
function parseLaravelInput(raw: unknown): TypedNode {
    if (isObjectLike(raw)) {
        return parseObject(raw);  // ← Guard di sini
    }
    throw new ParseError("Invalid input");
}

// Downstream (COMPILER)
function generate(node: TypedNode) {
    // node.kind: sudah discriminated
    return matchNode(node, {
        object: (n) => generateObject(n),
        model: (n) => generateModel(n),
        array: (n) => generateArray(n)
    });
}
```

**Prinsip**: Guard untuk **validasi input eksternal**, bukan untuk **navigasi IR internal**.

---

## Phase-by-Phase Cleanup Plan

### Phase 1: Core Semantic Types (Priority Tinggi)

**Target Files**:
```
packages/core/src/semantic/types.ts
packages/core/src/ir/domain/irTypes.ts
packages/core/src/ir/domain/SemanticTypeResolvers.ts
packages/core/src/ir/domain/ResourceIRBuilder.ts
```

**Action**: Hilangkan dari domain model:
- `Record<string, unknown>`
- `unknown[]`
- `[key: string]: unknown`
- `any`

**Replacement Strategy**:
1. Trace actual usage untuk menentukan **real shape**
2. Define explicit `interface` atau `type` untuk shape tersebut
3. Replace `Record` dengan typed array (`readonly T[]`)

---

### Phase 2: IR Structure (Discriminated Union ADT)

**Target**: Bentuk IR menjadi Discriminated Union yang eksplisit.

**BEFORE** (Weak typing):
```typescript
interface TypeIR {
    kind: string;  // ← Terlalu lemah
    // ... properties bervariasi
}
```

**AFTER** (Strong ADT):
```typescript
type TypeIR =
    | PrimitiveTypeIR
    | ReferenceTypeIR
    | ObjectTypeIR
    | CollectionTypeIR
    | NullableTypeIR
    | OptionalTypeIR
    | UnionTypeIR
    | IntersectionTypeIR
    | UnknownTypeIR;

interface PrimitiveTypeIR {
    readonly kind: 'primitive';
    readonly type: 'string' | 'number' | 'boolean' | 'date';
}

interface ObjectTypeIR {
    readonly kind: 'object';
    readonly properties: readonly PropertyIR[];
}

// ... explicit shapes untuk semua varian
```

---

### Phase 3: Context Cleanup

**Target Files**:
```
packages/core/src/semantic/ResolutionContext.ts
packages/cli/src/resolvers/types.ts
```

**BEFORE**:
```typescript
interface ResolutionContext {
    resources: unknown[];
    contextModel?: unknown;
    models?: any;
}
```

**AFTER**:
```typescript
interface ResolutionContext {
    readonly resources: readonly ResourceIR[];
    readonly contextModel?: ModelIR;
    readonly models: ReadonlyMap<string, ModelIR>;
}
```

---

### Phase 4: Reduce Guards in Downstream

**Setelah** type diperbaiki, banyak guards seperti:
```typescript
isObject()
isModelNode()
hasKind()
isArrayType()
isUnionType()
```

akan menjadi **tidak diperlukan** di jalur downstream.

**Strategy**:
1. Keep guards di **Origin Boundary** (untuk validasi external input)
2. Remove guards di **Compiler Pipeline** (IR sudah typed)
3. Replace conditional guards dengan **pattern matching**:

```typescript
// BEFORE: Guards everywhere
function lower(type: TypeIR) {
    if (isObject(type)) {
        return lowerObject(type);
    } else if (isArray(type)) {
        return lowerArray(type);
    }
    // ...
}

// AFTER: Pattern matching (zero if)
function lower(type: TypeIR) {
    return matchTypeIR(type, {
        primitive: (t) => lowerPrimitive(t),
        object: (t) => lowerObject(t),
        collection: (t) => lowerCollection(t),
        // ...
    });
}
```

---

### Phase 5: Utility API (Low Priority)

**Target Files**:
```
packages/core/src/utils/PathResolver.ts
packages/core/src/utils/QueryBuilder.ts
packages/cli/src/middleware/ErrorHandler.ts
packages/cli/src/middleware/AuthMiddleware.ts
```

**Reason**: Bagian ini memang punya **boundary dynamic** yang berbeda dari semantic IR.

`Record<string, any>` atau `Record<string, unknown>` **masih acceptable** di utility layer **jika**:
- Benar-benar untuk generic utility (misal: deep merge, object path access)
- Tidak digunakan untuk merepresentasikan **domain semantics**

---

## Verification Checklist

Untuk setiap interface yang di-refactor, pastikan:

### ✅ Type Safety
- [ ] Tidak ada `Record<string, unknown>` di IR/Domain
- [ ] Tidak ada `any` di IR/Domain
- [ ] Tidak ada `[key: string]: unknown` di semantic nodes
- [ ] Semua discriminated union punya `kind` field

### ✅ Downstream Simplicity
- [ ] Lowerer tidak perlu `if (!x)` atau `x ?? defaultX`
- [ ] Generator tidak perlu `hasOwnProperty()` checks
- [ ] Emitter tidak perlu type guards (`isObject`, `isArray`, dll)

### ✅ Origin Boundary Clear
- [ ] External input di-parse di boundary
- [ ] Validation errors thrown di boundary
- [ ] IR construction setelah validation complete

---

## Audit Script

```javascript
// audit-data-bebas.js
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let r = [];
  try {
    fs.readdirSync(dir).forEach(f => {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) {
        if (!p.includes('node_modules') && !p.includes('dist') && !p.includes('tests')) {
          r = r.concat(walk(p));
        }
      } else if (f.endsWith('.ts') && !f.endsWith('.d.ts')) {
        r.push(p);
      }
    });
  } catch (e) {}
  return r;
}

const files = walk('packages/cli/src').concat(walk('packages/core/src'));
const violations = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  
  // Check for violations
  let hasRecordUnknown = /Record<string,\s*unknown>/.test(content);
  let hasRecordAny = /Record<string,\s*any>/.test(content);
  let hasIndexUnknown = /\[key:\s*string\]:\s*unknown/.test(content);
  let hasUnknownArray = /unknown\[\]/.test(content);
  let hasAny = /:\s*any\b/.test(content);
  
  if (hasRecordUnknown || hasRecordAny || hasIndexUnknown || hasUnknownArray || hasAny) {
    violations.push({
      file: f,
      recordUnknown: hasRecordUnknown,
      recordAny: hasRecordAny,
      indexUnknown: hasIndexUnknown,
      unknownArray: hasUnknownArray,
      any: hasAny
    });
  }
});

console.log(`Found ${violations.length} files with "data bebas" violations\n`);

// Phase 1 Priority Files
const phase1 = violations.filter(v => 
  v.file.includes('semantic/types.ts') ||
  v.file.includes('ir/domain/irTypes.ts') ||
  v.file.includes('SemanticTypeResolvers.ts') ||
  v.file.includes('ResourceIRBuilder.ts')
);

console.log('=== PHASE 1 PRIORITY (Core Semantic Types) ===');
phase1.forEach(v => {
  console.log(`\n${v.file}`);
  if (v.recordUnknown) console.log('  - Record<string, unknown>');
  if (v.recordAny) console.log('  - Record<string, any>');
  if (v.indexUnknown) console.log('  - [key: string]: unknown');
  if (v.unknownArray) console.log('  - unknown[]');
  if (v.any) console.log('  - any');
});

console.log(`\n\nTotal Phase 1 files: ${phase1.length}`);
console.log(`Total violations: ${violations.length}`);
```

**Run**:
```bash
node audit-data-bebas.js
```

---

## Example Refactoring (Step-by-Step)

### Before:
```typescript
// packages/core/src/types/ir/resourceIrTypes.ts
export interface ResourceIR {
    name: string;
    model?: string;
    fields: Record<string, TypeIR>;
    metadata?: any;
}
```

### After:
```typescript
// packages/core/src/types/ir/resourceIrTypes.ts
export interface ResourceIR {
    readonly name: ResourceName;
    readonly model: ModelReference;
    readonly fields: readonly ResourceFieldIR[];
    readonly metadata: ResourceMetadata;
}

export interface ResourceFieldIR {
    readonly name: FieldName;
    readonly type: TypeIR;
    readonly optional: boolean;
    readonly nullable: boolean;
    readonly source: FieldSource;
}

export interface ResourceMetadata {
    readonly sourceFile: string;
    readonly sourceLine: number;
    readonly dependencies: readonly string[];
}

// Value Objects
export class ResourceName {
    private constructor(private readonly value: string) {}
    
    static parse(input: string): ResourceName | Error {
        if (!input || !/^[A-Z][a-zA-Z0-9]*Resource$/.test(input)) {
            return new Error("Invalid ResourceName");
        }
        return new ResourceName(input);
    }
    
    toString(): string { return this.value; }
}
```

---

## Success Criteria

Refactoring dianggap sukses jika:

1. ✅ **Phase 1 files** (core semantic) **0 violations**
2. ✅ **Downstream code** (lowerer/generator) **<5% defensive guards**
3. ✅ **Build passes** with **0 type errors**
4. ✅ **All tests pass** (714/714)
5. ✅ **IR traversal** tidak perlu runtime type checks

---

## Non-Goals

Kita **TIDAK** bertujuan:
- ❌ Menghapus semua `Record` di seluruh codebase (utility layer boleh pakai)
- ❌ Membuat semua type jadi Value Object (overkill untuk simple types)
- ❌ Rewrite seluruh 800+ file sekaligus (incremental better)

---

## Target Akhir

```
UNKNOWN              ← Record<string, unknown> OK
    ↓
BOUNDARY            ← Validation & Parse
    ↓
TYPED DOMAIN        ← Record hilang!
    ↓
SEMANTIC IR         ← Discriminated ADT
    ↓
LOWERER             ← 0 guards
    ↓
EMITTER             ← 0 checks
```

**Setelah data masuk IR, bentuk datanya sudah tidak bebas lagi.**
