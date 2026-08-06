# RouteSync: Panduan Sistem FieldNode (Unified Field Representation)

**Versi:** FieldNode v3 (Stage 2 CompilerRoadmap)  
**Status:** Migration Phase 1 - Core Type Definitions  
**Sumber:** `packages/core/src/types/field.ts` (95 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem FieldNode RouteSync. Ini adalah **unified field representation** yang menggantikan 3 sistem tipe paralel yang lama (ResourceFieldKind, ResponseMetadata, ParsedASTNode).

---

## 🎯 ARSITEKTUR FIELDNODE OVERVIEW

### Motivasi: Mengapa FieldNode Diperlukan?

**MASALAH LAMA (3 Sistem Paralel):**
```
ResourceFieldKind  → Untuk API resource fields
ResponseMetadata   → Untuk route response metadata  
ParsedASTNode      → Untuk PHP code parsing

❌ 3 representasi berbeda untuk konsep yang sama
❌ Conversion overhead antar-sistem
❌ Duplikasi logic di adapter layer
❌ Type safety lemah (union types tidak konsisten)
```

**SOLUSI BARU (1 Sistem Unified):**
```
FieldNode → Single unified representation

✅ Semua field types dalam 1 union
✅ Framework-agnostic AST representation
✅ Laravel-specific facts di resolved metadata
✅ Type-safe by construction
✅ Zero conversion overhead
```

### Prinsip Desain Core

1. **Framework Agnostic AST**: Parser hanya menghasilkan pure AST tanpa framework assumptions
2. **Resolution Separation**: Laravel-specific facts (Resource, Model, Collection) hanya di `resolved` field
3. **Source Traceability**: Setiap parsed field membawa `originalCode` untuk debugging
4. **Immutable Hierarchy**: Base interfaces membentuk hierarchy yang immutable
5. **Three-Phase Migration**: Gradual adoption tanpa breaking changes

---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. Base Interfaces

**BaseField — Foundation untuk Semua Field Types:**
```typescript
interface BaseField {
  resolved?: SemanticResolution;  // Hasil semantic analysis
  source?: SourceRef;              // Traceability ke source code
}
```

**ParsedField — Base untuk PHP Code yang Di-Parse:**
```typescript
interface ParsedField extends BaseField {
  originalCode: string;  // PHP code asli untuk debugging
}
```

**Perbedaan Kunci:**
- `BaseField`: Untuk fields yang declared secara eksplisit (attributes, JSON literals)
- `ParsedField`: Untuk fields yang di-parse dari PHP code strings

### 2. Declared Kinds (4 Types)

**Fields yang diketahui tanpa parsing PHP code:**

| Kind | Struktur | Contoh Use Case | Produced By |
|------|----------|-----------------|-------------|
| `PrimitiveField` | `{ kind: 'primitive', type: string }` | `#[Response('string')]` | LaravelRouteParser attribute scan |
| `ModelField` | `{ kind: 'model', model, collection, paginated? }` | `#[Response(User::class)]` | LaravelRouteParser attribute scan |
| `ObjectField` | `{ kind: 'object', fields: Record<string, FieldNode> }` | Custom object structure | JSON literal scan |
| `UnknownField` | `{ kind: 'unknown', code? }` | Unparseable expressions | Fallback untuk complex cases |

**📋 Contoh Declared Fields:**
```typescript
// Primitive dari attribute
const stringField: PrimitiveField = {
  kind: 'primitive',
  type: 'string'
};

// Model dari attribute dengan collection
const userCollectionField: ModelField = {
  kind: 'model',
  model: 'User',
  collection: true,
  paginated: false
};

// Object dengan nested fields
const customObjectField: ObjectField = {
  kind: 'object',
  fields: {
    status: { kind: 'primitive', type: 'string' },
    count: { kind: 'primitive', type: 'number' },
    items: { kind: 'model', model: 'Item', collection: true }
  }
};

// Unknown sebagai fallback
const complexField: UnknownField = {
  kind: 'unknown',
  code: 'SomeComplexExpression::that()->we()->cannot()->parse()'
};
```

### 3. Raw/Parsed Kinds (12 Types)

**Fields yang di-parse dari PHP code strings:**

#### 3.1 Raw Code Field
```typescript
interface RawCodeField extends BaseField {
  kind: 'raw_code';
  code: string;      // PHP code mentah
  hints?: IRHints;   // Lightweight pattern hints
}
```

**Purpose:** Input immutable dari PHP source, dengan optional hints untuk optimization.

#### 3.2 Simple Value Fields

**LiteralField — Literal values:**
```typescript
interface LiteralField extends ParsedField {
  kind: 'literal';
  value: string | number | boolean | null;
}
```

**VariableField — Variable references:**
```typescript
interface VariableField extends ParsedField {
  kind: 'variable';
  name: string;  // '$this', '$user', '$product'
}
```

**📋 Contoh:**
```typescript
// PHP: "hello world"
const literal: LiteralField = {
  kind: 'literal',
  originalCode: '"hello world"',
  value: "hello world"
};

// PHP: $this
const variable: VariableField = {
  kind: 'variable',
  originalCode: '$this',
  name: '$this'
};
```

#### 3.3 Access Fields

**PropertyAccessField — Property access:**
```typescript
interface PropertyAccessField extends ParsedField {
  kind: 'property_access';
  target: FieldNode | null;
  property: string;
  accessKind: AccessKind;  // 'property_access' | 'arrow_function' | 'array_access'
}
```

**NullsafePropertyAccessField — Nullsafe property access:**
```typescript
interface NullsafePropertyAccessField extends ParsedField {
  kind: 'nullsafe_property_access';
  target: FieldNode | null;
  property: string;
}
```

**NullsafeChainField — Chained nullsafe access:**
```typescript
interface NullsafeChainField extends ParsedField {
  kind: 'nullsafe_chain';
  chain: FieldNode[];
}
```

**📋 Contoh:**
```typescript
// PHP: $this->user->name
const propertyAccess: PropertyAccessField = {
  kind: 'property_access',
  originalCode: '$this->user->name',
  target: {
    kind: 'property_access',
    originalCode: '$this->user',
    target: { kind: 'variable', originalCode: '$this', name: '$this' },
    property: 'user',
    accessKind: 'property_access'
  },
  property: 'name',
  accessKind: 'property_access'
};

// PHP: $user?->profile?->bio
const nullsafeChain: NullsafeChainField = {
  kind: 'nullsafe_chain',
  originalCode: '$user?->profile?->bio',
  chain: [
    { kind: 'variable', originalCode: '$user', name: '$user' },
    { kind: 'nullsafe_property_access', originalCode: '?->profile', target: null, property: 'profile' },
    { kind: 'nullsafe_property_access', originalCode: '?->bio', target: null, property: 'bio' }
  ]
};
```

#### 3.4 Call Fields

**MethodCallField — Instance method calls:**
```typescript
interface MethodCallField extends ParsedField {
  kind: 'method_call';
  target: FieldNode | null;
  name: string;
  args: FieldNode[];
}
```

**StaticMethodCallField — Static method calls:**
```typescript
interface StaticMethodCallField extends ParsedField {
  kind: 'static_method_call';
  className: string;
  name: string;
  args: FieldNode[];
}
```

**NewInstanceField — Object instantiation:**
```typescript
interface NewInstanceField extends ParsedField {
  kind: 'new_instance';
  className: string;
  args: FieldNode[];
}
```

**📋 Contoh:**
```typescript
// PHP: $user->getName()
const methodCall: MethodCallField = {
  kind: 'method_call',
  originalCode: '$user->getName()',
  target: { kind: 'variable', originalCode: '$user', name: '$user' },
  name: 'getName',
  args: []
};

// PHP: User::find(123)
const staticCall: StaticMethodCallField = {
  kind: 'static_method_call',
  originalCode: 'User::find(123)',
  className: 'User',
  name: 'find',
  args: [{ kind: 'literal', originalCode: '123', value: 123 }]
};

// PHP: new UserResource($user)
const newInstance: NewInstanceField = {
  kind: 'new_instance',
  originalCode: 'new UserResource($user)',
  className: 'UserResource',
  args: [{ kind: 'variable', originalCode: '$user', name: '$user' }]
};
```

#### 3.5 Expression Fields

**BinaryExpressionField — Binary operations:**
```typescript
interface BinaryExpressionField extends ParsedField {
  kind: 'binary_expression';
  operator: string;  // '??', '+', '&&', '||', etc
  left: FieldNode;
  right: FieldNode;
}
```

**TernaryField — Ternary conditional:**
```typescript
interface TernaryField extends ParsedField {
  kind: 'ternary';
  condition: FieldNode;
  truthy: FieldNode;
  falsy: FieldNode;
}
```

**TypeCastField — Explicit type casting:**
```typescript
interface TypeCastField extends ParsedField {
  kind: 'type_cast';
  castType: 'int' | 'float' | 'string' | 'bool';
  expression: FieldNode;
}
```

**📋 Contoh:**
```typescript
// PHP: $user->name ?? 'Anonymous'
const binaryExpr: BinaryExpressionField = {
  kind: 'binary_expression',
  originalCode: "$user->name ?? 'Anonymous'",
  operator: '??',
  left: {
    kind: 'property_access',
    originalCode: '$user->name',
    target: { kind: 'variable', originalCode: '$user', name: '$user' },
    property: 'name',
    accessKind: 'property_access'
  },
  right: { kind: 'literal', originalCode: "'Anonymous'", value: 'Anonymous' }
};

// PHP: $active ? 'yes' : 'no'
const ternary: TernaryField = {
  kind: 'ternary',
  originalCode: "$active ? 'yes' : 'no'",
  condition: { kind: 'variable', originalCode: '$active', name: '$active' },
  truthy: { kind: 'literal', originalCode: "'yes'", value: 'yes' },
  falsy: { kind: 'literal', originalCode: "'no'", value: 'no' }
};
```

// PHP: (int) $request->input('id')
const typeCast: TypeCastField = {
  kind: 'type_cast',
  originalCode: "(int) $request->input('id')",
  castType: 'int',
  expression: {
    kind: 'method_call',
    originalCode: "$request->input('id')",
    target: { kind: 'variable', originalCode: '$request', name: '$request' },
    name: 'input',
    args: [{ kind: 'literal', originalCode: "'id'", value: 'id' }]
  }
};
```

---

## 🔄 UNIFIED DEFINITIONS (RouteDef, ResourceDef, ModelDef)

### 4. RouteDef — Route Definition dengan FieldNode

```typescript
interface RouteDef {
  name: string;           // 'users.show'
  method: string;         // 'GET', 'POST', etc
  path: string;           // '/users/{id}'
  auth: boolean;
  middleware: string[];
  schema?: Record<string, unknown> | null;
  response?: FieldNode | null;  // ← FieldNode untuk response type
  assignments?: Record<string, string> | null;
  stableHash?: string;
  sourceFile?: string | null;
  sourceLine?: number | null;
}
```

**Key Difference dari ParsedRoute:**
- `response` adalah `FieldNode` (bukan `ResponseMetadata`)
- Unified type system across entire pipeline

### 5. ResourceDef — Resource Definition dengan FieldNode

```typescript
interface ResourceDef {
  name: string;         // 'UserResource'
  model?: string;       // 'User'
  fields: Record<string, FieldNode>;  // ← FieldNode untuk setiap field
  assignments?: Record<string, string>;
  sourceFile?: string | null;
  sourceLine?: number | null;
}
```

**Key Difference dari ParsedResource:**
- `fields` adalah `Record<string, FieldNode>` (bukan `ResourceFieldKind`)
- Unified representation untuk resource fields

### 6. ModelDef — Model Definition dengan FieldNode

```typescript
interface ModelDef {
  name: string;         // 'User'
  table?: string;       // 'users'
  columns?: { name: string; type: string; nullable: boolean }[];
  hidden?: string[];
  appends?: string[];
  casts?: Record<string, string>;
  relations?: Record<string, { type: string; model: string }>;
  accessors?: Record<string, FieldNode>;  // ← FieldNode untuk accessors
}
```

**Key Difference dari ParsedModel:**
- `accessors` adalah `Record<string, FieldNode>` (bukan arbitrary metadata)
- Type-safe accessor representation

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Framework-Agnostic AST Construction:**
```typescript
// BENAR: Parser menghasilkan pure AST
function parsePropertyAccess(code: string): PropertyAccessField {
  return {
    kind: 'property_access',
    originalCode: code,
    target: parseFieldExpression(targetCode),  // Recursive parsing
    property: extractProperty(code),
    accessKind: 'property_access'  // Framework-agnostic
    // TIDAK ada 'resource' atau 'collection' di sini
  };
}

// Laravel-specific facts ditempatkan di resolved
const resolvedField: PropertyAccessField = {
  ...parsedField,
  resolved: {
    status: 'resolved',
    type: 'model',
    model: 'User',
    collection: false,
    confidence: 95,
    trace: [{ rule: 'ModelPropertyAccess', evidence: 'User.name column exists' }]
  }
};
```

**2. Type-Safe FieldNode Processing:**
```typescript
// BENAR: Pattern matching dengan discriminated union
function processFieldNode(field: FieldNode): ProcessedField {
  switch (field.kind) {
    case 'primitive':
      return processPrimitiveField(field);
    
    case 'model':
      return processModelField(field);
    
    case 'property_access':
      return processPropertyAccess(field);
    
    case 'method_call':
      return processMethodCall(field);
    
    // ... handle semua cases
    
    default:
      // TypeScript ensures exhaustiveness
      const _exhaustive: never = field;
      throw new Error(`Unhandled field kind: ${(field as any).kind}`);
  }
}
```

**3. Immutable Field Construction:**
```typescript
// BENAR: Immutable construction dengan proper typing
function createMethodCallField(
  originalCode: string,
  target: FieldNode | null,
  name: string,
  args: FieldNode[]
): MethodCallField {
  return {
    kind: 'method_call',
    originalCode,
    target,
    name,
    args: Object.freeze([...args])  // Immutable args array
  };
}

// BENAR: Enrichment tanpa mutation
function enrichWithResolution(
  field: FieldNode,
  resolution: SemanticResolution
): FieldNode {
  return {
    ...field,
    resolved: resolution  // Add resolution, tidak mutate existing
  };
}
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Framework-Specific AST Construction:**
```typescript
// SALAH: Parser memasukkan Laravel assumptions
function parseStaticCall(code: string): StaticMethodCallField {
  const field = {
    kind: 'static_method_call',
    originalCode: code,
    className: extractClassName(code),
    name: extractMethodName(code),
    args: [],
    // SALAH: Laravel assumptions di AST level
    isResource: className.endsWith('Resource'),  // JANGAN!
    isModel: isValidModelName(className),        // JANGAN!
    collection: name === 'all' || name === 'get' // JANGAN!
  };
  return field;
}
```
**2. Mutation dari Existing Fields:**
```typescript
// SALAH: Mutating existing field
function badEnrichment(field: FieldNode, newData: any): void {
  field.resolved = newData;  // JANGAN! Field harus immutable
  (field as any).extraData = newData;  // JANGAN! Breaking type safety
}

// BENAR: Immutable enrichment
function goodEnrichment(field: FieldNode, newData: SemanticResolution): FieldNode {
  return { ...field, resolved: newData };  // Create new instance
}
```

**3. Mengabaikan originalCode:**
```typescript
// SALAH: Tidak menyimpan original code
function badParsing(code: string): LiteralField {
  return {
    kind: 'literal',
    // originalCode: MISSING!  // JANGAN! Hilang traceability
    value: extractValue(code)
  };
}

// BENAR: Selalu include originalCode untuk parsed fields
function goodParsing(code: string): LiteralField {
  return {
    kind: 'literal',
    originalCode: code,  // ✓ Traceability preserved
    value: extractValue(code)
  };
}
```

---

## 🔄 MIGRATION STATUS & STRATEGY

### Migration Phase 1: Core Type Definitions ✅ COMPLETE

**Status:** DONE  
**Location:** `packages/core/src/types/field.ts`  
**Deliverables:**
- [x] FieldNode union type dengan 16 variants
- [x] Base interfaces (BaseField, ParsedField)
- [x] Unified definitions (RouteDef, ResourceDef, ModelDef)
- [x] Legacy adapter functions di `legacyFieldAdapter.ts`

### Migration Phase 2: Parser Integration 🔄 IN PROGRESS

**Target:** Update parsers untuk menggunakan FieldNode secara internal
**Components:**
- `PhpCodeParser.ts` → Use FieldNode internally
- `incremental.ts` → Update untuk FieldNode processing
- `SemanticResolutionKernel` → Accept FieldNode inputs

**Acceptance Criteria:**
- [ ] `routesync.ir.json` output unchanged (atau expected changes only)
- [ ] Backward compatibility maintained
- [ ] Performance tidak degraded

### Migration Phase 3: Legacy Cleanup 📋 NOT STARTED

**Target:** Remove old type systems setelah semua consumers migrated

**Components untuk Delete:**
- `ResourceFieldKind` type dan semua references
- `ResponseMetadata` type dan semua references  
- `ParsedASTNode` type dan semua references
- `legacyFieldAdapter.ts` entire file

**Acceptance Criteria:**
- [ ] Zero references ke old type systems
- [ ] All consumers using FieldNode
- [ ] Clean codebase tanpa legacy adapter overhead

---

## 🔍 DEBUGGING & TRACEABILITY

### Source Code Tracing

**originalCode Field untuk Debugging:**
```typescript
function debugFieldResolution(field: FieldNode): void {
  if ('originalCode' in field) {
    console.group(`Field Debug: ${field.kind}`);
    console.log(`Original PHP: ${field.originalCode}`);
    
    if (field.resolved) {
      console.log(`Resolved Type: ${field.resolved.type}`);
      console.log(`Confidence: ${field.resolved.confidence}%`);
      field.resolved.trace?.forEach(t => {
        console.log(`  - ${t.rule}: ${t.evidence}`);
      });
    }
    
    console.groupEnd();
  }
}
```
### Field Traversal Utilities

**Recursive Field Walking:**
```typescript
function walkFieldNode(
  field: FieldNode,
  visitor: (field: FieldNode, path: string[]) => void,
  path: string[] = []
): void {
  visitor(field, path);
  
  switch (field.kind) {
    case 'object':
      Object.entries(field.fields).forEach(([key, childField]) => {
        walkFieldNode(childField, visitor, [...path, key]);
      });
      break;
      
    case 'property_access':
      if (field.target) {
        walkFieldNode(field.target, visitor, [...path, 'target']);
      }
      break;
      
    case 'method_call':
      if (field.target) {
        walkFieldNode(field.target, visitor, [...path, 'target']);
      }
      field.args.forEach((arg, i) => {
        walkFieldNode(arg, visitor, [...path, 'args', i.toString()]);
      });
      break;
      
    case 'binary_expression':
      walkFieldNode(field.left, visitor, [...path, 'left']);
      walkFieldNode(field.right, visitor, [...path, 'right']);
      break;
      
    case 'ternary':
      walkFieldNode(field.condition, visitor, [...path, 'condition']);
      walkFieldNode(field.truthy, visitor, [...path, 'truthy']);
      walkFieldNode(field.falsy, visitor, [...path, 'falsy']);
      break;
      
    // ... handle other nested cases
  }
}

// Usage untuk find semua unresolved fields
function findUnresolvedFields(field: FieldNode): FieldNode[] {
  const unresolved: FieldNode[] = [];
  
  walkFieldNode(field, (f, path) => {
    if (!f.resolved || f.resolved.status !== 'resolved') {
      unresolved.push(f);
    }
  });
  
  return unresolved;
}
```
### Validation & Health Checks

**FieldNode Validation:**
```typescript
function validateFieldNode(field: FieldNode): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!field.kind) {
    errors.push('Missing required field: kind');
  }
  
  // Check parsed field requirements
  if ('originalCode' in field) {
    if (!field.originalCode) {
      errors.push('ParsedField must have non-empty originalCode');
    }
  }
  
  // Type-specific validation
  switch (field.kind) {
    case 'property_access':
      if (!field.property) {
        errors.push('PropertyAccessField must have property name');
      }
      if (!field.accessKind) {
        warnings.push('PropertyAccessField missing accessKind, defaulting to property_access');
      }
      break;
      
    case 'method_call':
      if (!field.name) {
        errors.push('MethodCallField must have method name');
      }
      if (!Array.isArray(field.args)) {
        errors.push('MethodCallField args must be array');
      }
      break;
      
    case 'model':
      if (!field.model) {
        errors.push('ModelField must have model name');
      }
      break;
      
    // ... other validations
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

---

## 🎯 INTEGRASI DENGAN PIPELINE ROUTESYNC

### Parser Integration Points

**PhpCodeParser.ts Integration:**
```typescript
// Current: returns ParsedASTNode
function parseExpression(code: string): ParsedASTNode;

// Migration Target: returns FieldNode
function parseExpression(code: string): FieldNode;
```
**LaravelRouteParser.ts Integration:**
```typescript
// Current: creates ResponseMetadata
interface ParsedRoute {
  response?: ResponseMetadata;
}

// Migration Target: creates FieldNode
interface RouteDef {
  response?: FieldNode | null;
}
```

**SemanticResolutionKernel Integration:**
```typescript
// Current: accepts multiple input types
class SemanticResolutionKernel {
  resolveResourceField(field: ResourceFieldKind): SemanticNode;
  resolveResponseMetadata(response: ResponseMetadata): SemanticNode;
  resolveASTNode(ast: ParsedASTNode): SemanticNode;
}

// Migration Target: unified input
class SemanticResolutionKernel {
  resolveField(field: FieldNode): FieldNode;  // Returns enriched FieldNode
}
```

### Generator Integration Points

**ZodTierGenerator Integration:**
```typescript
// Current: handles multiple input types
class ZodTierGenerator {
  private static buildResponseZodType(
    response: ResponseMetadata,  // Multiple input types
    kernel: SemanticKernel,
    context: any
  ): string;
}

// Migration Target: unified FieldNode input
class ZodTierGenerator {
  private static buildResponseZodType(
    field: FieldNode,  // Single unified input
    context: any
  ): string;
}
```

---

## 📋 EXTENSION GUIDELINES

### Adding New FieldNode Types

**1. Extend FieldNode Union:**
```typescript
// Add new interface
interface CustomExpressionField extends ParsedField {
  kind: 'custom_expression';
  customData: string;
  metadata: CustomMetadata;
}

// Update union type
export type FieldNode =
  | PrimitiveField | ModelField | ObjectField | UnknownField
  | RawCodeField | LiteralField | VariableField | PropertyAccessField
  // ... existing types
  | CustomExpressionField;  // New type
```
**2. Update PhpCodeParser:**
```typescript
// Add parsing logic
class PhpCodeParser {
  private parseCustomExpression(code: string): CustomExpressionField {
    return {
      kind: 'custom_expression',
      originalCode: code,
      customData: extractCustomData(code),
      metadata: analyzeCustom(code)
    };
  }
  
  // Update main parser
  parseExpression(code: string): FieldNode {
    if (isCustomExpression(code)) {
      return this.parseCustomExpression(code);
    }
    // ... existing parsing logic
  }
}
```

**3. Update SemanticResolutionKernel:**
```typescript
class SemanticResolutionKernel {
  resolveField(field: FieldNode): FieldNode {
    switch (field.kind) {
      case 'custom_expression':
        return this.resolveCustomExpression(field);
      // ... existing cases
    }
  }
  
  private resolveCustomExpression(field: CustomExpressionField): FieldNode {
    // Custom resolution logic
    return {
      ...field,
      resolved: {
        status: 'resolved',
        type: 'custom',
        confidence: 80,
        trace: [{ rule: 'CustomResolver', evidence: '...' }]
      }
    };
  }
}
```

**4. Update All Processors:**
```typescript
// Update semua function yang process FieldNode
function processFieldNode(field: FieldNode): ProcessedField {
  switch (field.kind) {
    case 'custom_expression':
      return processCustomExpression(field);
    // ... existing cases
  }
}
```

### Menambah Definition Types Baru

**1. Define New Definition:**
```typescript
interface ServiceDef {
  name: string;
  methods: Record<string, FieldNode>;  // Use FieldNode untuk methods
  dependencies?: string[];
  sourceFile?: string | null;
}
```
**2. Update Scanner:**
```typescript
// Add to LaravelRouteParser.ts atau scanner yang sesuai
class LaravelRouteParser {
  scanServices(): ServiceDef[] {
    // Scan service classes, extract methods sebagai FieldNode
    return services.map(service => ({
      name: service.name,
      methods: this.extractServiceMethods(service),  // Returns Record<string, FieldNode>
      dependencies: this.extractDependencies(service),
      sourceFile: service.fileName
    }));
  }
}
```

---

## 🚀 PERFORMANCE & OPTIMIZATION

### Memory Management

**Immutable Structure Benefits:**
- Structural sharing antar FieldNode instances
- Safe concurrent access tanpa locks
- GC-friendly (no reference cycles dari mutation)

**Optimization Patterns:**
```typescript
// Reuse common field instances
const COMMON_FIELDS = {
  THIS_VARIABLE: { kind: 'variable', originalCode: '$this', name: '$this' } as const,
  NULL_LITERAL: { kind: 'literal', originalCode: 'null', value: null } as const,
  TRUE_LITERAL: { kind: 'literal', originalCode: 'true', value: true } as const
};

function createPropertyAccess(target: FieldNode, property: string): PropertyAccessField {
  return {
    kind: 'property_access',
    originalCode: `${getOriginalCode(target)}->${property}`,
    target,
    property,
    accessKind: 'property_access'
  };
}
```

### Processing Optimization

**Visitor Pattern untuk Batch Processing:**
```typescript
interface FieldVisitor<T> {
  visitPrimitive(field: PrimitiveField): T;
  visitModel(field: ModelField): T;
  visitPropertyAccess(field: PropertyAccessField): T;
  visitMethodCall(field: MethodCallField): T;
  // ... other visit methods
}
```
class ZodSchemaEmitter implements FieldVisitor<string> {
  visitPrimitive(field: PrimitiveField): string {
    return mapPrimitiveToZod(field.type);
  }
  
  visitModel(field: ModelField): string {
    const baseSchema = `${field.model}Schema`;
    return field.collection ? `z.array(${baseSchema})` : baseSchema;
  }
  
  visitPropertyAccess(field: PropertyAccessField): string {
    // Delegate ke resolved type jika ada
    if (field.resolved?.type) {
      return mapSemanticTypeToZod(field.resolved.type);
    }
    return 'z.unknown()';  // Fallback
  }
  
  // ... implement other visitors
}

// Usage
const emitter = new ZodSchemaEmitter();
const zodSchema = field.accept(emitter);  // Type-safe emission
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Migration Progress Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Legacy Type Usages | High | 0 | 🔄 Phase 2 |
| FieldNode Coverage | Partial | 100% | 🔄 Phase 2 |
| Adapter Function Calls | Many | 0 | 📋 Phase 3 |
| Type Safety Issues | Some | 0 | 🔄 Phase 2 |
| Performance Overhead | Low | None | ✅ Phase 1 |

### Code Quality Indicators

- **Type Safety**: 100% FieldNode processing uses discriminated unions
- **Immutability**: 0 mutations pada FieldNode instances setelah creation
- **Traceability**: 100% parsed fields punya originalCode
- **Framework Agnostic**: 0 Laravel-specific assumptions di AST level
- **Semantic Separation**: 100% framework facts di resolved metadata

### Performance Indicators

- **Memory Usage**: Structural sharing reduces memory overhead
- **Processing Speed**: Single unified type eliminates conversion overhead
- **Type Checking**: Strong typing reduces runtime errors
- **Debug Experience**: originalCode provides excellent debugging trail

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/core/src/types/semantic.ts` - SemanticResolution, AccessKind
- `packages/core/src/types/contract.ts` - Contract system interfaces
- `packages/cli/src/parsers/PhpCodeParser.ts` - PHP parsing ke FieldNode

### Consumers (Downstream)
- `packages/cli/src/generators/` - Code generation dari FieldNode
- `packages/cli/src/resolvers/` - Semantic resolution pada FieldNode  
- `packages/core/src/types/legacyFieldAdapter.ts` - Migration adapters

### Configuration Files
- `packages/core/tsconfig.json` - TypeScript configuration
- `compiler/CompilerBacklog.md` - Migration roadmap
- `compiler/CompilerRoadmap.md` - Architecture evolution plan

---

**Sistem FieldNode adalah future unified representation untuk semua field types di RouteSync. Memahami struktur ini essential untuk migration yang sukses dan maintainability jangka panjang.**

**Last Updated:** Juli 26, 2026  
**FieldNode Version:** v3 (Stage 2)  
**Migration Status:** Phase 1 Complete, Phase 2 In Progress