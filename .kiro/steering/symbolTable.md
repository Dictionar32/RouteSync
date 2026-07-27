# RouteSync: Panduan Sistem Symbol Table

**Versi:** SymbolTable v1  
**Status:** Core Performance Infrastructure untuk AI Agent  
**Sumber:** `packages/core/src/semantic/SymbolTable.ts` (85 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem Symbol Table RouteSync. Ini adalah **O(1) lookup optimization** system yang mengganti scan linear berulang dengan hash-based lookup untuk performance semantic resolution.

---

## 🎯 ARSITEKTUR SYMBOL TABLE OVERVIEW

### Motivasi: Mengapa Symbol Table Diperlukan?

**MASALAH LAMA (Linear Scan Performance):**
```typescript
// ❌ O(n) scan repeated di setiap field resolution
function resolveModelField(modelName: string, fieldName: string, context: Context) {
  // Di AccessorResolver:
  const model1 = context.models.find(m => m.name === modelName);  // O(n)
  
  // Di VariableResolver:
  const model2 = context.models.find(m => m.name === modelName);  // O(n) again
  
  // Di ExpressionResolver:  
  const model3 = context.models.find(m => m.name === modelName);  // O(n) again
  
  // Di ModelColumnResolver:
  const model4 = context.models.find(m => m.name === modelName);  // O(n) again
  
  // Total: O(n) × number of resolvers × number of fields = O(n²) complexity
}
```
**SOLUSI BARU (O(1) Hash-Based Lookup):**
```typescript
// ✅ O(1) lookup dengan pre-built symbol table
const symbolTable = new SymbolTable(models);  // Built once per scan

function resolveModelField(modelName: string, fieldName: string) {
  const modelSymbol = symbolTable.get(modelName);  // O(1)
  if (!modelSymbol) return null;
  
  const column = modelSymbol.column(fieldName);    // O(1)
  const accessor = modelSymbol.accessor(fieldName); // O(1)
  const relation = modelSymbol.relation(fieldName); // O(1)
  const cast = modelSymbol.cast(fieldName);        // O(1)
  
  // Total: O(1) complexity, built once, used thousands of times
}
```

### Prinsip Desain Core

1. **Build Once, Use Many**: Symbol table dibangun sekali per scan, digunakan ribuan kali
2. **O(1) Lookup Performance**: Hash-based lookup mengganti linear scan
3. **Comprehensive Model Access**: Column, accessor, relation, cast dalam satu wrapper
4. **Legacy Compatibility**: Support struktur data lama dan baru
5. **Case-Insensitive Fallback**: Mendukung pencarian case-insensitive untuk robustness

---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. ModelSymbol — Model Wrapper dengan O(1) Access

**Tujuan:** Wrapper untuk satu ModelNode dengan pre-built maps untuk fast lookup

```typescript
class ModelSymbol {
  readonly name: string;
  private readonly columnsByName: Map<string, ModelColumn>;
  
  constructor(public readonly node: ModelNode);
  
  column(name: string): ModelColumn | undefined;    // O(1)
  accessor(name: string): ModelAccessor | undefined; // O(1)
  relation(name: string): ModelRelation | undefined; // O(1)
  cast(columnName: string): string | undefined;     // O(1)
}
```

**Key Features:**
- **Pre-built Column Map**: `columnsByName` dibangun di constructor, bukan per-query
- **Legacy Support**: Support `node.columns[]` (baru) dan `node.fields{}` (lama)
- **Direct Access**: Accessor, relation, cast access langsung ke node properties
- **Type Safety**: Return types sesuai dengan semantic types yang diharapkan

**📋 ModelSymbol Construction Examples:**
```typescript
// Modern model structure (node.columns[])
const modernModel: ModelNode = {
  name: 'User',
  columns: [
    { name: 'id', type: 'bigint', nullable: false },
    { name: 'email', type: 'varchar', nullable: false },
    { name: 'created_at', type: 'timestamp', nullable: true }
  ],
  accessors: {
    'full_name': { /* accessor definition */ }
  },
  relations: {
    'posts': { type: 'hasMany', model: 'Post' }
  },
  casts: {
    'created_at': 'datetime',
    'settings': 'array'
  }
};

const modernSymbol = new ModelSymbol(modernModel);
// columnsByName = Map { 'id' => {name:'id', type:'bigint'}, 'email' => {name:'email', type:'varchar'} }

// Legacy model structure (node.fields{})
const legacyModel: ModelNode = {
  name: 'User',
  fields: {
    'id': { type: 'bigint', nullable: false },
    'email': { type: 'varchar', nullable: false }
  }
};

const legacySymbol = new ModelSymbol(legacyModel);
// columnsByName = Map { 'id' => {name:'id', type:'bigint'}, 'email' => {name:'email', type:'varchar'} }
```
### 2. SymbolTable — Global Model Registry

**Tujuan:** Global registry untuk semua models dengan multiple access patterns

```typescript
class SymbolTable {
  private byName: Map<string, ModelSymbol>;           // Exact match
  private byLowerName: Map<string, ModelSymbol>;      // Case-insensitive
  
  constructor(models: ModelNode[]);
  
  get(name: string): ModelSymbol | undefined;                    // O(1) exact
  has(name: string): boolean;                                   // O(1) check
  getCaseInsensitive(name: string): ModelSymbol | undefined;    // O(1) case-insensitive
  findFirst(predicate: (node: ModelNode) => boolean): ModelSymbol | undefined; // O(n) predicate
}
```

**Lookup Strategies:**
- **Exact Match**: `get()` untuk case-sensitive lookup (primary)
- **Case-Insensitive**: `getCaseInsensitive()` untuk robustness
- **Predicate Search**: `findFirst()` untuk complex conditions (fallback ke O(n))
- **Existence Check**: `has()` untuk boolean checks

**📋 SymbolTable Usage Examples:**
```typescript
const models: ModelNode[] = [
  { name: 'User', columns: [/* ... */] },
  { name: 'Post', columns: [/* ... */] },
  { name: 'Category', columns: [/* ... */] }
];

const symbolTable = new SymbolTable(models);

// Exact match (primary usage)
const userSymbol = symbolTable.get('User');          // ✓ Found
const nullSymbol = symbolTable.get('user');         // ✗ Not found (case-sensitive)

// Case-insensitive fallback
const userSymbolCI = symbolTable.getCaseInsensitive('user');    // ✓ Found
const userSymbolCI2 = symbolTable.getCaseInsensitive('USER');   // ✓ Found
const userSymbolCI3 = symbolTable.getCaseInsensitive('UsEr');   // ✓ Found

// Existence check
const hasUser = symbolTable.has('User');             // ✓ true
const hasUnknown = symbolTable.has('Unknown');       // ✗ false

// Complex predicate search (O(n) fallback)
const firstModelWithTimestamps = symbolTable.findFirst(node => 
  node.columns?.some(col => col.name.includes('_at'))
);
```

### 3. Performance Optimization Strategy

**Construction Time (Build Once):**
```typescript
// Called once per scan/sync run
const symbolTable = new SymbolTable(manifest.models);

// For each model:
// - Build columnsByName map from columns[] or fields{}
// - Register in byName map (exact)
// - Register in byLowerName map (case-insensitive, first-wins)
```

**Runtime Access (Use Many):**
```typescript
// Called thousands of times during semantic resolution
const resolveUserField = (fieldName: string) => {
  const userSymbol = symbolTable.get('User');       // O(1)
  if (!userSymbol) return null;
  
  // All subsequent lookups are O(1)
  const column = userSymbol.column(fieldName);      // O(1) - hash lookup
  const accessor = userSymbol.accessor(fieldName);  // O(1) - direct property access
  const relation = userSymbol.relation(fieldName); // O(1) - direct property access
  const cast = userSymbol.cast(fieldName);         // O(1) - direct property access
  
  return { column, accessor, relation, cast };
};

// Performance improvement: O(n) → O(1) per lookup
// For 100 models × 1000 field resolutions = 100,000 lookups
// Old: 100,000 × O(n) = O(n × 100,000) = massive slowdown
// New: 100,000 × O(1) = O(100,000) = constant time
```

---

## 🔄 MIGRATION FROM LINEAR SCANS

### Legacy Pattern (Before SymbolTable)

**8 Resolver Classes melakukan identical scan:**
```typescript
// AccessorResolver.ts
const model = context.models.find(m => m.name === modelName);  // O(n) scan #1

// ConditionalWrapperResolver.ts  
const model = context.models.find(m => m.name === modelName);  // O(n) scan #2

// VariableResolver.ts
const model = context.models.find(m => m.name === modelName);  // O(n) scan #3
// ... same scan again in different method                     // O(n) scan #4

// ExpressionResolver.ts
const model = context.models.find(m => m.name === modelName);  // O(n) scan #5
// ... same scan again in different method                     // O(n) scan #6

// MethodReturnResolver.ts
const model = context.models.find(m => m.name === modelName);  // O(n) scan #7

// ModelColumnResolver.ts
const model = context.models.find(m => m.name === modelName);  // O(n) scan #8
```
### New Pattern (With SymbolTable)

**Single construction, multiple O(1) access:**
```typescript
// Built once at start of semantic resolution
const symbolTable = new SymbolTable(context.models);

// All resolvers now use O(1) lookup
class AccessorResolver {
  resolve(field: FieldNode, context: Context) {
    const modelSymbol = context.symbolTable.get(modelName);  // O(1)
    const accessor = modelSymbol?.accessor(fieldName);       // O(1)
    return processAccessor(accessor);
  }
}

class VariableResolver {
  resolve(field: FieldNode, context: Context) {
    const modelSymbol = context.symbolTable.get(modelName);  // O(1)
    const column = modelSymbol?.column(fieldName);           // O(1)
    return processColumn(column);
  }
}

// Pattern: O(n) construction once → O(1) access always
```

### Context Integration Pattern

**SemanticResolutionKernel Integration:**
```typescript
class SemanticResolutionKernel {
  private symbolTable: SymbolTable;
  
  constructor(models: ModelNode[]) {
    this.symbolTable = new SymbolTable(models);  // Build once
  }
  
  resolve(field: FieldNode, context: ResolutionContext): SemanticResolution {
    // Thread symbolTable to all resolvers
    const enhancedContext = {
      ...context,
      symbolTable: this.symbolTable
    };
    
    return this.applyResolvers(field, enhancedContext);
  }
}

// All resolvers receive symbolTable in context
interface ResolutionContext {
  models: ModelNode[];           // Legacy, for backward compatibility
  symbolTable: SymbolTable;     // New, for performance
  // ... other context
}
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Construction Pattern:**
```typescript
// BENAR: Build once per semantic resolution session
class SemanticResolver {
  resolve(manifest: RouteManifest): ResolvedManifest {
    const symbolTable = new SymbolTable(manifest.models);  // Build once
    
    // Use for all field resolutions
    return manifest.routes.map(route => {
      return this.resolveRoute(route, { symbolTable });
    });
  }
}
```

**2. Access Pattern:**
```typescript
// BENAR: Use symbolTable for lookups, not linear scans
function resolveModelProperty(modelName: string, propertyName: string, context: Context): SemanticResolution {
  // Use symbol table for O(1) lookup
  const modelSymbol = context.symbolTable.get(modelName);
  if (!modelSymbol) {
    return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
  }
  
  // Check different property types in order of precedence
  const column = modelSymbol.column(propertyName);
  if (column) {
    return resolveColumn(column, modelSymbol);
  }
  
  const accessor = modelSymbol.accessor(propertyName);
  if (accessor) {
    return resolveAccessor(accessor, modelSymbol);
  }
  
  const relation = modelSymbol.relation(propertyName);
  if (relation) {
    return resolveRelation(relation, modelSymbol);
  }
  
  // Not found in any category
  return { status: 'unknown', type: 'unknown', confidence: 0, trace: [] };
}
```

**3. Case-Insensitive Fallback Pattern:**
```typescript
// BENAR: Try exact match first, then case-insensitive
function findModel(modelName: string, symbolTable: SymbolTable): ModelSymbol | null {
  // Primary: exact match
  let modelSymbol = symbolTable.get(modelName);
  if (modelSymbol) {
    return modelSymbol;
  }
  
  // Fallback: case-insensitive
  modelSymbol = symbolTable.getCaseInsensitive(modelName);
  if (modelSymbol) {
    console.warn(`Found model via case-insensitive match: ${modelName} → ${modelSymbol.name}`);
    return modelSymbol;
  }
  
  return null;
}
```
### ❌ Anti-Pattern yang Harus Dihindari

**1. Re-building SymbolTable Multiple Times:**
```typescript
// SALAH: Building symbol table in each resolver
class BadResolver {
  resolve(field: FieldNode, context: Context): SemanticResolution {
    const symbolTable = new SymbolTable(context.models);  // JANGAN! Expensive rebuild
    const modelSymbol = symbolTable.get(modelName);
    return processModel(modelSymbol);
  }
}

// BENAR: Use pre-built symbol table
class GoodResolver {
  resolve(field: FieldNode, context: Context): SemanticResolution {
    const modelSymbol = context.symbolTable.get(modelName);  // O(1) access
    return processModel(modelSymbol);
  }
}
```

**2. Fallback to Linear Scan:**
```typescript
// SALAH: Ignoring symbol table, falling back to linear scan
function badModelLookup(modelName: string, context: Context): ModelNode | null {
  // Ignore available symbolTable, use expensive scan
  return context.models.find(m => m.name === modelName);  // O(n) - avoid this!
}

// BENAR: Use symbol table
function goodModelLookup(modelName: string, context: Context): ModelSymbol | null {
  return context.symbolTable.get(modelName);  // O(1)
}
```

**3. Direct Node Access Instead of ModelSymbol:**
```typescript
// SALAH: Accessing model.columns directly, rebuilding lookup
function badColumnLookup(modelSymbol: ModelSymbol, columnName: string): ModelColumn | null {
  // Don't scan the node directly!
  const column = modelSymbol.node.columns?.find(c => c.name === columnName);  // O(n)
  return column || null;
}

// BENAR: Use ModelSymbol's O(1) methods
function goodColumnLookup(modelSymbol: ModelSymbol, columnName: string): ModelColumn | null {
  return modelSymbol.column(columnName);  // O(1) - uses pre-built map
}
```

---

## 🔍 DEBUGGING & PERFORMANCE ANALYSIS

### SymbolTable Construction Analysis

```typescript
function analyzeSymbolTable(symbolTable: SymbolTable, models: ModelNode[]): AnalysisReport {
  const report = {
    totalModels: models.length,
    modelsByType: {
      withColumns: 0,
      withFields: 0,
      withAccessors: 0,
      withRelations: 0,
      withCasts: 0
    },
    averageColumnsPerModel: 0,
    caseCollisions: [] as string[]
  };
  
  let totalColumns = 0;
  const caseMap = new Map<string, string[]>();
  
  models.forEach(model => {
    // Count model types
    if (model.columns?.length) report.modelsByType.withColumns++;
    if (model.fields) report.modelsByType.withFields++;
    if (model.accessors) report.modelsByType.withAccessors++;
    if (model.relations) report.modelsByType.withRelations++;
    if (model.casts) report.modelsByType.withCasts++;
    
    // Count columns
    const columnCount = model.columns?.length || Object.keys(model.fields || {}).length;
    totalColumns += columnCount;
    
    // Check case collisions
    const lowerName = model.name.toLowerCase();
    if (!caseMap.has(lowerName)) {
      caseMap.set(lowerName, []);
    }
    caseMap.get(lowerName)!.push(model.name);
  });
  
  report.averageColumnsPerModel = totalColumns / models.length;
  
  // Find case collisions (multiple models with same lowercase name)
  caseMap.forEach((names, lowerName) => {
    if (names.length > 1) {
      report.caseCollisions.push(`${lowerName}: [${names.join(', ')}]`);
    }
  });
  
  return report;
}
```

### Performance Monitoring

```typescript
class SymbolTableProfiler {
  private lookupCount = 0;
  private cacheHits = 0;
  private caseFallbacks = 0;
  
  profileLookup<T>(
    operation: () => T,
    operationType: 'exact' | 'case-insensitive' | 'predicate'
  ): T {
    this.lookupCount++;
    
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    if (result !== undefined) {
      this.cacheHits++;
      if (operationType === 'case-insensitive') {
        this.caseFallbacks++;
      }
    }
    
    console.log(`Lookup ${operationType}: ${(endTime - startTime).toFixed(3)}ms`);
    return result;
  }
  
  getStats() {
    return {
      totalLookups: this.lookupCount,
      cacheHitRatio: this.cacheHits / this.lookupCount,
      caseFallbackRatio: this.caseFallbacks / this.lookupCount
    };
  }
}

// Usage dalam resolver
const profiler = new SymbolTableProfiler();

function profiledModelLookup(modelName: string, symbolTable: SymbolTable): ModelSymbol | null {
  return profiler.profileLookup(() => {
    return symbolTable.get(modelName) || symbolTable.getCaseInsensitive(modelName);
  }, 'exact');
}
```
### Memory Usage Analysis

```typescript
function analyzeMemoryUsage(symbolTable: SymbolTable, models: ModelNode[]): MemoryReport {
  // Estimate memory usage of symbol table structures
  let totalColumnMaps = 0;
  let totalMapEntries = 0;
  
  models.forEach(model => {
    const columnCount = model.columns?.length || Object.keys(model.fields || {}).length;
    totalColumnMaps++;
    totalMapEntries += columnCount;
  });
  
  const estimatedMemory = {
    modelSymbols: models.length * 200,        // Estimated bytes per ModelSymbol
    columnMaps: totalColumnMaps * 100,       // Estimated bytes per Map
    mapEntries: totalMapEntries * 50,        // Estimated bytes per Map entry
    nameIndexes: models.length * 2 * 50,     // byName + byLowerName indexes
  };
  
  const totalEstimated = Object.values(estimatedMemory).reduce((sum, val) => sum + val, 0);
  
  return {
    modelCount: models.length,
    totalColumnMaps,
    totalMapEntries,
    estimatedMemoryKB: Math.round(totalEstimated / 1024),
    memoryBreakdown: estimatedMemory
  };
}
```

---

## 🎯 INTEGRASI DENGAN PIPELINE ROUTESYNC

### SemanticKernel Integration

```typescript
// SemanticKernelV2 menggunakan SymbolTable untuk performance
class SemanticKernelV2 {
  private symbolTable: SymbolTable;
  
  constructor(models: ModelNode[]) {
    this.symbolTable = new SymbolTable(models);  // Build once
  }
  
  resolve(field: FieldNode, context: ResolutionContext): SemanticResolution {
    // Thread symbolTable to resolution context
    const enhancedContext = {
      ...context,
      symbolTable: this.symbolTable
    };
    
    // All resolver rules can now use O(1) model lookup
    return this.applyResolutionRules(field, enhancedContext);
  }
}
```

### Resolver Plugin Integration

```typescript
// Resolver plugins receive SymbolTable in context
abstract class BaseResolver {
  abstract resolve(field: FieldNode, context: ResolutionContext): SemanticResolution | null;
  
  protected getModel(modelName: string, context: ResolutionContext): ModelSymbol | null {
    // Standardized model lookup using symbolTable
    return context.symbolTable?.get(modelName) || 
           context.symbolTable?.getCaseInsensitive(modelName) || 
           null;
  }
}

class ModelColumnResolver extends BaseResolver {
  resolve(field: FieldNode, context: ResolutionContext): SemanticResolution | null {
    if (field.kind !== 'property_access') return null;
    
    const modelSymbol = this.getModel(field.target?.modelName, context);
    if (!modelSymbol) return null;
    
    // O(1) column lookup instead of array scan
    const column = modelSymbol.column(field.property);
    if (!column) return null;
    
    return {
      status: 'resolved',
      type: mapSqlType(column.type),
      nullable: column.nullable,
      confidence: 100,
      trace: [{
        source: 'ModelColumnResolver',
        rule: `Column ${modelSymbol.name}.${field.property} → ${column.type}`,
        input: field.property,
        output: column.type
      }]
    };
  }
}
```

### Generator Integration Points

```typescript
// Generators dapat menggunakan SymbolTable untuk fast model access
class ZodContractGenerator {
  generateModelSchemas(models: ModelNode[]): string[] {
    const symbolTable = new SymbolTable(models);  // Build for generation
    const schemas: string[] = [];
    
    models.forEach(model => {
      const modelSymbol = symbolTable.get(model.name);
      if (!modelSymbol) return;
      
      const schema = this.generateSingleModelSchema(modelSymbol);
      schemas.push(schema);
    });
    
    return schemas;
  }
  
  private generateSingleModelSchema(modelSymbol: ModelSymbol): string {
    const lines: string[] = [];
    lines.push(`export const ${modelSymbol.name}Schema = z.object({`);
    
    // Use ModelSymbol's O(1) access for all columns
    modelSymbol.node.columns?.forEach(column => {
      const zodType = this.mapColumnToZod(column, modelSymbol);
      lines.push(`  ${column.name}: ${zodType},`);
    });
    
    lines.push('});');
    return lines.join('\n');
  }
  
  private mapColumnToZod(column: ModelColumn, modelSymbol: ModelSymbol): string {
    const cast = modelSymbol.cast(column.name);  // O(1) cast lookup
    let baseType = mapSqlTypeToZod(column.type);
    
    if (cast) {
      baseType = mapCastToZod(cast);
    }
    
    return column.nullable ? `${baseType}.nullable()` : baseType;
  }
}
```

---

## 📋 EXTENSION GUIDELINES

### Adding New Model Properties

**1. Extend ModelNode Interface:**
```typescript
interface ModelNode {
  // ... existing properties
  customProperties?: Record<string, CustomProperty>;
}
```

**2. Add to ModelSymbol:**
```typescript
class ModelSymbol {
  // ... existing methods
  
  customProperty(name: string): CustomProperty | undefined {
    return this.node.customProperties?.[name];  // O(1) access
  }
}
```

**3. Update Construction Logic (if needed for performance):**
```typescript
class ModelSymbol {
  private readonly customPropertiesByName?: Map<string, CustomProperty>;
  
  constructor(public readonly node: ModelNode) {
    // ... existing construction
    
    // Add custom property map if performance-critical
    if (node.customProperties) {
      this.customPropertiesByName = new Map(Object.entries(node.customProperties));
    }
  }
  
  customProperty(name: string): CustomProperty | undefined {
    return this.customPropertiesByName?.get(name) || this.node.customProperties?.[name];
  }
}
```
### Adding New Lookup Methods

**1. Add to SymbolTable:**
```typescript
class SymbolTable {
  // ... existing methods
  
  // Custom lookup methods
  findByTableName(tableName: string): ModelSymbol | undefined {
    return this.findFirst(node => node.tableName === tableName);
  }
  
  findModelsWithCast(castType: string): ModelSymbol[] {
    const results: ModelSymbol[] = [];
    for (const symbol of this.byName.values()) {
      if (symbol.node.casts) {
        const hasCast = Object.values(symbol.node.casts).includes(castType);
        if (hasCast) results.push(symbol);
      }
    }
    return results;
  }
  
  findModelsWithRelation(relationType: string): ModelSymbol[] {
    const results: ModelSymbol[] = [];
    for (const symbol of this.byName.values()) {
      if (symbol.node.relations) {
        const hasRelation = Object.values(symbol.node.relations).some(
          rel => rel.type === relationType
        );
        if (hasRelation) results.push(symbol);
      }
    }
    return results;
  }
}
```

---

## 🚀 PERFORMANCE & OPTIMIZATION

### Memory Optimization

**Lazy Column Map Construction:**
```typescript
class ModelSymbol {
  readonly name: string;
  private _columnsByName?: Map<string, ModelColumn>;  // Lazy initialization
  
  constructor(public readonly node: ModelNode) {
    this.name = node.name;
    // Don't build columnsByName until first access
  }
  
  private get columnsByName(): Map<string, ModelColumn> {
    if (!this._columnsByName) {
      this._columnsByName = new Map();
      
      if (Array.isArray(this.node.columns)) {
        for (const c of this.node.columns) {
          this._columnsByName.set(c.name, c);
        }
      } else if (this.node.fields && typeof this.node.fields === 'object') {
        for (const [name, f] of Object.entries(this.node.fields)) {
          this._columnsByName.set(name, { 
            name, 
            type: f.type, 
            nullable: f.nullable 
          });
        }
      }
    }
    
    return this._columnsByName;
  }
  
  column(name: string): ModelColumn | undefined {
    return this.columnsByName.get(name);  // Triggers lazy construction if needed
  }
}
```

### Cache-Friendly Access Patterns

**Batch Operations:**
```typescript
class SymbolTableBatch {
  constructor(private symbolTable: SymbolTable) {}
  
  // Process multiple models efficiently
  batchLookup(modelNames: string[]): Map<string, ModelSymbol> {
    const results = new Map<string, ModelSymbol>();
    
    for (const name of modelNames) {
      const symbol = this.symbolTable.get(name) || 
                    this.symbolTable.getCaseInsensitive(name);
      if (symbol) {
        results.set(name, symbol);
      }
    }
    
    return results;
  }
  
  // Batch column resolution
  batchColumnLookup(
    lookups: Array<{ modelName: string; columnName: string }>
  ): Map<string, ModelColumn> {
    const results = new Map<string, ModelColumn>();
    
    for (const { modelName, columnName } of lookups) {
      const symbol = this.symbolTable.get(modelName);
      if (symbol) {
        const column = symbol.column(columnName);
        if (column) {
          results.set(`${modelName}.${columnName}`, column);
        }
      }
    }
    
    return results;
  }
}
```

### Concurrent Access Safety

**Thread-Safe Design:**
```typescript
// SymbolTable is immutable after construction - safe for concurrent access
class SymbolTable {
  private readonly byName: ReadonlyMap<string, ModelSymbol>;
  private readonly byLowerName: ReadonlyMap<string, ModelSymbol>;
  
  constructor(models: ModelNode[]) {
    const byName = new Map<string, ModelSymbol>();
    const byLowerName = new Map<string, ModelSymbol>();
    
    // Construction logic...
    
    // Freeze maps to prevent mutations
    this.byName = Object.freeze(byName);
    this.byLowerName = Object.freeze(byLowerName);
  }
  
  // All methods are read-only, safe for concurrent access
}
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Performance Metrics

| Metric | Before SymbolTable | With SymbolTable | Improvement |
|--------|-------------------|------------------|-------------|
| Model Lookup Complexity | O(n) | O(1) | n× faster |
| Column Lookup Complexity | O(n) | O(1) | n× faster |
| Memory Usage Pattern | Linear scan overhead | Hash map overhead | More predictable |
| Cache Locality | Poor (array scan) | Good (hash access) | Better CPU usage |
| Concurrent Access | Safe but slow | Safe and fast | Scalable |

### Quality Indicators

- **Lookup Success Rate**: >95% of model lookups successful
- **Case Fallback Rate**: <10% of lookups require case-insensitive fallback
- **Memory Efficiency**: <5% memory overhead compared to raw models array
- **Construction Time**: <10ms for 1000 models
- **Access Time**: <0.1ms per lookup operation

### Developer Experience Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| API Simplicity | Single method call | Easy adoption |
| Type Safety | 100% typed methods | Prevent runtime errors |
| Backward Compatibility | 100% legacy support | No breaking changes |
| Documentation Coverage | 100% methods documented | Clear usage |
| Test Coverage | 100% code paths | Reliability |

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/core/src/semantic/types.ts` - ModelNode, ModelColumn interfaces
- Laravel reflection system - Source of model metadata
- Database schema analysis - Column type information

### Consumers (Downstream)
- `packages/core/src/semantic/SemanticKernelV2.ts` - Primary consumer
- `packages/cli/src/resolvers/` - Resolver plugin classes
- Code generation pipeline - Fast model access during generation

### Related Components
- `packages/core/src/semantic/EloquentRegistry.ts` - Complementary registry
- `packages/cli/src/resolvers/SemanticResolutionKernel.ts` - Resolution coordination
- Performance profiling tools - Monitoring and optimization

### Configuration Files
- `packages/core/tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration for symbol table tests

---

## 🔍 TESTING & VALIDATION

### Unit Test Pattern

```typescript
describe('SymbolTable', () => {
  const testModels: ModelNode[] = [
    {
      name: 'User',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'email', type: 'varchar', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: true }
      ],
      accessors: { full_name: { /* ... */ } },
      relations: { posts: { type: 'hasMany', model: 'Post' } },
      casts: { created_at: 'datetime' }
    },
    {
      name: 'Post',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'title', type: 'varchar', nullable: false }
      ]
    }
  ];

  let symbolTable: SymbolTable;

  beforeEach(() => {
    symbolTable = new SymbolTable(testModels);
  });

  test('exact model lookup', () => {
    const user = symbolTable.get('User');
    expect(user).toBeDefined();
    expect(user?.name).toBe('User');
  });

  test('case-insensitive model lookup', () => {
    const user = symbolTable.getCaseInsensitive('user');
    expect(user).toBeDefined();
    expect(user?.name).toBe('User');
  });

  test('column lookup performance', () => {
    const user = symbolTable.get('User');
    expect(user).toBeDefined();
    
    const column = user!.column('email');
    expect(column).toEqual({
      name: 'email',
      type: 'varchar',
      nullable: false
    });
  });

  test('accessor lookup', () => {
    const user = symbolTable.get('User');
    const accessor = user?.accessor('full_name');
    expect(accessor).toBeDefined();
  });

  test('relation lookup', () => {
    const user = symbolTable.get('User');
    const relation = user?.relation('posts');
    expect(relation).toEqual({
      type: 'hasMany',
      model: 'Post'
    });
  });

  test('cast lookup', () => {
    const user = symbolTable.get('User');
    const cast = user?.cast('created_at');
    expect(cast).toBe('datetime');
  });
});
```

### Integration Test Pattern

```typescript
describe('SymbolTable Integration', () => {
  test('resolver integration', async () => {
    const models = await loadTestModels();
    const symbolTable = new SymbolTable(models);
    
    const context = { symbolTable, /* ... other context */ };
    const resolver = new ModelColumnResolver();
    
    const field: FieldNode = {
      kind: 'property_access',
      target: { /* User model reference */ },
      property: 'email'
    };
    
    const result = resolver.resolve(field, context);
    
    expect(result).toEqual({
      status: 'resolved',
      type: 'string',
      nullable: false,
      confidence: 100,
      trace: expect.arrayContaining([
        expect.objectContaining({
          source: 'ModelColumnResolver'
        })
      ])
    });
  });
});
```

### Performance Benchmark

```typescript
describe('SymbolTable Performance', () => {
  test('lookup performance vs linear scan', () => {
    const models = generateTestModels(1000);  // 1000 models
    const symbolTable = new SymbolTable(models);
    
    const iterations = 10000;
    
    // Benchmark SymbolTable lookup
    const startSymbolTable = performance.now();
    for (let i = 0; i < iterations; i++) {
      const modelName = `Model${i % 1000}`;
      symbolTable.get(modelName);
    }
    const endSymbolTable = performance.now();
    
    // Benchmark linear scan
    const startLinear = performance.now();
    for (let i = 0; i < iterations; i++) {
      const modelName = `Model${i % 1000}`;
      models.find(m => m.name === modelName);
    }
    const endLinear = performance.now();
    
    const symbolTableTime = endSymbolTable - startSymbolTable;
    const linearTime = endLinear - startLinear;
    
    console.log(`SymbolTable: ${symbolTableTime.toFixed(2)}ms`);
    console.log(`Linear scan: ${linearTime.toFixed(2)}ms`);
    console.log(`Improvement: ${(linearTime / symbolTableTime).toFixed(1)}x faster`);
    
    // SymbolTable should be significantly faster
    expect(symbolTableTime).toBeLessThan(linearTime / 5);
  });
});
```

---

**SymbolTable adalah critical performance optimization yang mengganti O(n) linear scans dengan O(1) hash lookups di semantic resolution. Memahami system ini essential untuk maintaining performance dan scalability di RouteSync compiler pipeline.**

**Last Updated:** Juli 26, 2026  
**SymbolTable Version:** v1  
**Status:** Production infrastructure dengan proven performance benefits