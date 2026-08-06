# RouteSync: Panduan Legacy Field Adapter System

**Versi:** Legacy Migration v1  
**Status:** Transitional Architecture untuk AI Agent  
**Sumber:** `packages/core/src/types/legacyFieldAdapter.ts` (168 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem legacy field adapter RouteSync. Ini adalah layer transisi dalam **Phase 1 FieldNode Migration** yang memungkinkan migrasi bertahap dari struktur data lama ke struktur FieldNode yang baru.

---

## 🎯 ARSITEKTUR MIGRATION OVERVIEW

RouteSync sedang dalam proses **3-Phase Migration** dari legacy field structures ke unified FieldNode system:

```
Phase 1: Legacy Field Adapter (CURRENT)
├── ResourceFieldKind → FieldNode (via fieldFromResourceFieldKind)
├── ResponseMetadata → FieldNode (via fieldFromResponseMetadata)  
└── ParsedASTNode → FieldNode (via fieldFromParsedASTNode)

Phase 2: Gradual Call Site Migration
├── Wrap old-type output dengan fieldFromX()
├── Migrate satu call site pada satu waktu
└── Rest of function dapat ditulis untuk FieldNode

Phase 3: Complete Migration
└── Delete seluruh legacyFieldAdapter.ts file
```

### Prinsip Migration Strategy

1. **Backward Compatibility**: Struktur lama tetap bekerja selama migration
2. **Incremental Migration**: Satu call site pada satu waktu, bukan big bang
3. **Type Safety**: Adapters menjaga type safety selama transisi
4. **Zero Runtime Impact**: Adapters adalah pure functions tanpa side effects
5. **Deprecation Path**: Clear path untuk menghilangkan legacy code

---

## 🏗️ KOMPONEN ADAPTER UTAMA

### 1. fieldFromResourceFieldKind — ResourceFieldKind → FieldNode

**Tujuan:** Mengkonversi legacy ResourceFieldKind struktur ke FieldNode modern

```typescript
export function fieldFromResourceFieldKind(old: ResourceFieldKind): FieldNode
```

**Input Structure (ResourceFieldKind):**
```typescript
type ResourceFieldKind = (
  | { kind: 'primitive'; type: string }
  | { kind: 'model'; model: string; collection: boolean }
  | { kind: 'resource'; resource: string; collection: boolean }
  | { kind: 'object'; fields: Record<string, ResourceFieldKind> }
  | { kind: 'unknown' }
) & {
  resolved?: SemanticResolution
  semantic?: SemanticResolution
}
```

**📋 Conversion Rules:**
```typescript
// 1. Primitive fields - direct mapping
{ kind: 'primitive', type: 'string' }
→ { kind: 'primitive', type: 'string' }

// 2. Model fields - preserve collection flag
{ kind: 'model', model: 'User', collection: true }
→ { kind: 'model', model: 'User', collection: true }

// 3. Resource fields - convert to unknown + resolved metadata
{ kind: 'resource', resource: 'UserResource', collection: false }
→ { 
    kind: 'unknown',
    resolved: {
      status: 'resolved',
      type: 'resource', 
      resource: 'UserResource',
      collection: false,
      confidence: 100,
      trace: [{ source: 'fieldFromResourceFieldKind', ... }]
    }
  }

// 4. Object fields - recursive conversion
{ kind: 'object', fields: { name: { kind: 'primitive', type: 'string' } } }
→ { kind: 'object', fields: { name: { kind: 'primitive', type: 'string' } } }

// 5. Unknown fields - pass through
{ kind: 'unknown' }
→ { kind: 'unknown' }
```

**📋 Usage Example:**
```typescript
// Legacy ResourceFieldKind processing
function processLegacyResource(resource: ResourceFieldKind): void {
  // Convert to modern FieldNode
  const fieldNode = fieldFromResourceFieldKind(resource);
  
  // Sekarang dapat menggunakan modern FieldNode APIs
  processFieldNode(fieldNode);
}

// Recursive object field conversion
const legacyUserResource: ResourceFieldKind = {
  kind: 'object',
  fields: {
    id: { kind: 'primitive', type: 'number' },
    profile: { kind: 'resource', resource: 'ProfileResource', collection: false },
    posts: { kind: 'resource', resource: 'PostResource', collection: true }
  }
};

const modernFieldNode = fieldFromResourceFieldKind(legacyUserResource);
// Result: FieldNode with nested fields properly converted
```

### 2. fieldFromResponseMetadata — ResponseMetadata → FieldNode  

**Tujuan:** Mengkonversi legacy ResponseMetadata dengan multiple resolution fields

```typescript
export function fieldFromResponseMetadata(old: ResponseMetadata): FieldNode
```

**Key Challenge:** ResponseMetadata punya inconsistency dengan `resolved` dan `semantic` fields yang bisa ada bersamaan:

```typescript
interface ResponseMetadata {
  // ... base fields
  resolved?: SemanticResolution & { /* ... */ };
  semantic?: SemanticResolution & { /* ... */ };
  collection?: boolean;    // Runtime enrichment
  paginated?: boolean;     // Runtime enrichment  
  type?: string;          // Runtime enrichment
  wrapped?: boolean;      // Laravel $wrap behavior
}
```

**📋 Resolution Conflict Handling:**
```typescript
// Conflict resolution strategy: semantic wins over resolved
const resolved = (old.semantic ?? old.resolved) as SemanticResolution | undefined;

// Priority reasoning:
// 1. `semantic` field was written most recently by SemanticKernelV2
// 2. `resolved` field might contain stale data from previous passes
// 3. SemanticKernelV2 is source of truth untuk latest analysis
```

**📋 Conversion Examples:**
```typescript
// Model response dengan pagination
const legacyResponse: ResponseMetadata = {
  kind: 'model',
  model: 'User', 
  collection: true,
  paginated: true,
  resolved: { status: 'resolved', type: 'model', confidence: 90 },
  semantic: { status: 'resolved', type: 'model', confidence: 95 }
};

const converted = fieldFromResponseMetadata(legacyResponse);
// Result: { 
//   kind: 'model', 
//   model: 'User', 
//   collection: true, 
//   paginated: true,
//   resolved: { /* semantic data wins */ }
// }

// Resource response conversion  
const resourceResponse: ResponseMetadata = {
  kind: 'resource',
  resource: 'UserResource',
  collection: false
};

const convertedResource = fieldFromResponseMetadata(resourceResponse);
// Result: {
//   kind: 'unknown',  // Resource tidak punya direct FieldNode kind
//   resolved: {
//     status: 'resolved',
//     type: 'resource',
//     resource: 'UserResource', 
//     collection: false,
//     confidence: 100
//   }
// }
```

### 3. fieldFromParsedASTNode — ParsedASTNode → FieldNode

**Tujuan:** Mengkonversi legacy ParsedASTNode structures ke FieldNode dengan proper AST mapping

```typescript
export function fieldFromParsedASTNode(
  ast: ParsedASTNode, 
  originalCode = ''
): FieldNode
```

**Design Decisions:**
- **Framework-specific fields dropped**: `resource`, `collection` pada AST nodes dihilangkan by design
- **Preserved as resolved metadata**: Jika old AST sudah infer `resource`, fact itu dipreserve dalam `resolved` field
- **Original code tracking**: `originalCode` parameter untuk traceability ke source PHP

**📋 AST Node Conversions:**

```typescript
// 1. Literal values
{ kind: 'literal', value: "hello" }
→ { kind: 'literal', originalCode: '"hello"', value: "hello" }

// 2. Variable references  
{ kind: 'variable', name: '$this' }
→ { kind: 'variable', originalCode: '$this', name: '$this' }

// 3. Property access dengan accessKind detection
{ kind: 'property_access', target: {...}, property: 'name' }
→ { 
    kind: 'property_access', 
    originalCode: '$this->name',
    target: {...}, 
    property: 'name',
    accessKind: 'property_access'  // Auto-detected atau default
  }

// 4. Method calls
{ kind: 'method_call', target: {...}, name: 'getName', args: [] }
→ { 
    kind: 'method_call',
    originalCode: '$this->getName()', 
    target: {...},
    name: 'getName',
    args: []
  }

// 5. Static method calls dengan className extraction
{ 
  kind: 'static_method_call', 
  target: { kind: 'model', model: 'User' },
  name: 'find' 
}
→ { 
    kind: 'static_method_call',
    originalCode: 'User::find()',
    className: 'User',  // Extracted dari ModelAST target
    name: 'find',
    args: []
  }

// 6. Resource AST → unknown + resolved  
{ kind: 'resource', resource: 'UserResource', collection: false }
→ {
    kind: 'unknown',
    resolved: {
      status: 'resolved',
      type: 'resource', 
      resource: 'UserResource',
      collection: false,
      confidence: 100
    }
  }

// 7. Complex expressions
{ 
  kind: 'ternary',
  condition: { kind: 'variable', name: '$user' },
  truthy: { kind: 'literal', value: 'active' },
  falsy: { kind: 'literal', value: 'inactive' }
}
→ {
    kind: 'ternary',
    originalCode: '$user ? "active" : "inactive"',
    condition: { kind: 'variable', ... },
    truthy: { kind: 'literal', ... },
    falsy: { kind: 'literal', ... }
  }
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Incremental Migration Pattern:**
```typescript
// BENAR: Wrap legacy output dengan adapter
function processResourceFields(oldResource: ResourceFieldKind): ProcessedOutput {
  // Convert legacy to modern
  const fieldNode = fieldFromResourceFieldKind(oldResource);
  
  // Rest of function menggunakan modern FieldNode APIs
  return processModernFieldNode(fieldNode);
}

// BENAR: Gradual call site migration
class LegacyResourceProcessor {
  // Phase 1: Keep old method, add adapter wrapper
  processOldWay(resource: ResourceFieldKind): Result {
    const fieldNode = fieldFromResourceFieldKind(resource);
    return this.processNewWay(fieldNode);
  }
  
  // Phase 2: New method using FieldNode directly
  processNewWay(fieldNode: FieldNode): Result {
    // Modern implementation
    return processFieldNode(fieldNode);
  }
}
```

**2. Conflict Resolution Handling:**
```typescript
// BENAR: Handle semantic vs resolved conflicts properly
function migrateResponseWithConflicts(response: ResponseMetadata): FieldNode {
  const converted = fieldFromResponseMetadata(response);
  
  // Verify conversion preserved important metadata
  if (response.semantic && response.resolved) {
    console.warn(
      `Semantic-Resolved conflict resolved: ` +
      `semantic (${response.semantic.confidence}) wins over ` + 
      `resolved (${response.resolved.confidence})`
    );
  }
  
  return converted;
}
```

**3. Type-Safe AST Migration:**
```typescript
// BENAR: Preserve original code untuk debugging
function migrateASTWithTraceability(
  ast: ParsedASTNode,
  sourceCode: string
): FieldNode {
  const fieldNode = fieldFromParsedASTNode(ast, sourceCode);
  
  // Validate conversion preserved essential information
  if (ast.kind === 'resource' && fieldNode.resolved) {
    console.log(
      `Resource AST converted: ${ast.resource} → ` +
      `resolved.resource = ${fieldNode.resolved.resource}`
    );
  }
  
  return fieldNode;
}
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Using Adapters for New Code:**
```typescript
// SALAH: Menggunakan adapter untuk new code
function newFeatureProcessor(): FieldNode {
  const legacyData = createResourceFieldKind(); // JANGAN!
  return fieldFromResourceFieldKind(legacyData); // JANGAN!
}

// BENAR: Write new code dengan FieldNode directly
function newFeatureProcessor(): FieldNode {
  return createModernFieldNode(); // Langsung FieldNode
}
```

**2. Ignoring Resolution Conflicts:**
```typescript
// SALAH: Ignore semantic vs resolved conflicts
function badMigration(response: ResponseMetadata): FieldNode {
  return fieldFromResponseMetadata(response); // Silent conflict resolution
}

// BENAR: Acknowledge dan handle conflicts
function goodMigration(response: ResponseMetadata): FieldNode {
  if (response.semantic && response.resolved) {
    logResolutionConflict(response);
  }
  
  return fieldFromResponseMetadata(response);
}
```

**3. Permanent Adapter Usage:**
```typescript
// SALAH: Treating adapters as permanent solution
class PermanentLegacyProcessor {
  // JANGAN! Adapter bukan permanent solution
  process(data: ResourceFieldKind): Result {
    return fieldFromResourceFieldKind(data);
  }
}

// BENAR: Plan migration path
class MigrationAwareProcessor {
  // TODO Phase 2: Migrate to FieldNode input parameter
  // TODO Phase 3: Remove this method entirely
  @deprecated("Use processFieldNode instead")
  processLegacy(data: ResourceFieldKind): Result {
    return this.processFieldNode(fieldFromResourceFieldKind(data));
  }
  
  processFieldNode(fieldNode: FieldNode): Result {
    // Modern implementation
    return processField(fieldNode);
  }
}
```

---

## 🔍 DEBUGGING & MIGRATION TRACKING

### Migration Progress Tracking

```typescript
// Track migration progress dengan metrics
class MigrationMetrics {
  private static adapterUsage = new Map<string, number>();
  
  static trackAdapterUsage(adapterName: string, inputType: string): void {
    const key = `${adapterName}:${inputType}`;
    const count = this.adapterUsage.get(key) || 0;
    this.adapterUsage.set(key, count + 1);
  }
  
  static getMigrationProgress(): MigrationReport {
    return {
      totalAdapterCalls: Array.from(this.adapterUsage.values()).reduce((a, b) => a + b, 0),
      adapterBreakdown: Object.fromEntries(this.adapterUsage),
      migrationPhase: this.determineMigrationPhase()
    };
  }
  
  private static determineMigrationPhase(): 'phase1' | 'phase2' | 'phase3' {
    const totalCalls = Array.from(this.adapterUsage.values()).reduce((a, b) => a + b, 0);
    
    if (totalCalls === 0) return 'phase3'; // No adapter usage
    if (totalCalls < 100) return 'phase2'; // Low usage, migrating
    return 'phase1'; // High usage, still in transition
  }
}

// Instrumented adapters
export function fieldFromResourceFieldKind(old: ResourceFieldKind): FieldNode {
  MigrationMetrics.trackAdapterUsage('fieldFromResourceFieldKind', old.kind);
  
  // Original adapter logic...
  switch (old.kind) {
    // ... conversion logic
  }
}
```

### Adapter Validation

```typescript
// Validate adapter conversions untuk correctness
function validateAdapterConversion<T, R>(
  adapter: (input: T) => R,
  input: T,
  expectedOutputValidation: (output: R) => boolean,
  description: string
): R {
  const output = adapter(input);
  
  if (!expectedOutputValidation(output)) {
    throw new Error(
      `Adapter validation failed: ${description}\n` +
      `Input: ${JSON.stringify(input)}\n` +
      `Output: ${JSON.stringify(output)}`
    );
  }
  
  return output;
}

// Usage
const convertedField = validateAdapterConversion(
  fieldFromResourceFieldKind,
  legacyResource,
  (output) => output.kind !== undefined && output.kind !== '',
  'ResourceFieldKind → FieldNode conversion'
);
```

### Legacy Code Detection

```typescript
// Detect remaining legacy usage untuk Phase 3 planning
function scanLegacyUsage(codebase: string[]): LegacyUsageReport {
  const legacyPatterns = [
    /fieldFromResourceFieldKind/g,
    /fieldFromResponseMetadata/g, 
    /fieldFromParsedASTNode/g,
    /ResourceFieldKind/g,
    /ResponseMetadata.*resolved.*semantic/g
  ];
  
  const usage = legacyPatterns.map(pattern => ({
    pattern: pattern.source,
    occurrences: codebase.flatMap(file => 
      [...file.matchAll(pattern)].map(match => ({
        file,
        line: file.substring(0, match.index).split('\n').length,
        match: match[0]
      }))
    )
  }));
  
  return {
    totalOccurrences: usage.reduce((sum, p) => sum + p.occurrences.length, 0),
    patternBreakdown: usage,
    readyForPhase3: usage.every(p => p.occurrences.length === 0)
  };
}
```