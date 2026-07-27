# RouteSync: Panduan Sistem Contract & Semantic Resolution

**Versi:** Contract v2  
**Status:** Core Semantic Infrastructure  
**Sumber:** `packages/core/src/types/contract.ts` (44 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem contract dan semantic resolution RouteSync. Ini adalah **evidence-based type resolution** system yang mendukung traceability dan confidence scoring untuk setiap keputusan tipe.

---

## 🎯 ARSITEKTUR CONTRACT SYSTEM OVERVIEW

### Motivasi: Mengapa Evidence-Based Resolution?

**MASALAH LAMA (Black Box Resolution):**
```typescript
// ❌ Resolution tanpa evidence
function resolveType(code: string): string {
  if (code.includes('->name')) return 'string';  // Guess-work
  if (code.includes('->id')) return 'number';    // No confidence
  return 'unknown';  // No trace why
}
```

**SOLUSI BARU (Evidence-Based Resolution):**
```typescript
// ✅ Resolution dengan evidence trail
const resolution: SemanticResolution = {
  status: 'resolved',
  type: 'string',
  confidence: 95,
  trace: [
    { source: 'ModelColumnResolver', rule: 'Field lookup from Schema Model User.name', input: 'name', output: 'string' },
    { source: 'DatabaseSchema', rule: 'Column users.name → VARCHAR(255)', input: 'name', output: 'string' }
  ]
};
```

### Prinsip Desain Core

1. **Evidence-Based Resolution**: Setiap keputusan tipe harus punya evidence trail
2. **Confidence Scoring**: Explicit confidence untuk setiap resolution (0-100)
3. **Traceability**: Full trace dari raw code ke final type
4. **JSON Object Support**: Specialized handling untuk Laravel JSON/array casts
5. **Resolution Status**: Clear status (resolved/partial/unknown) untuk setiap node
---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. ResolutionStatus — Status Hierarchy

```typescript
type ResolutionStatus = 'resolved' | 'unknown' | 'partial'
```

**Status Levels:**
- **resolved**: Tipe fully determined dengan high confidence
- **partial**: Tipe partially determined, butuh additional context
- **unknown**: Tidak dapat determine tipe, fallback ke unknown

**📋 Contoh Status Usage:**
```typescript
// Resolved: Clear evidence dari database schema
const resolvedField: SemanticResolution = {
  status: 'resolved',
  type: 'string',
  confidence: 100,
  trace: [{ source: 'DatabaseSchema', rule: 'Column users.email → VARCHAR(255)' }]
};

// Partial: Tipe diketahui, tapi nullable unclear
const partialField: SemanticResolution = {
  status: 'partial',
  type: 'string',
  nullable: undefined,  // Butuh additional analysis
  confidence: 70,
  trace: [{ source: 'PropertyAccess', rule: 'Inferred from property name pattern' }]
};

// Unknown: Tidak ada evidence sufficient
const unknownField: SemanticResolution = {
  status: 'unknown',
  type: 'unknown',
  confidence: 0,
  trace: [{ source: 'Fallback', rule: 'No applicable resolution rules' }]
};
```

### 2. TraceNode — Evidence Trail System

```typescript
interface TraceNode {
  source: string;   // Resolver yang menghasilkan evidence
  rule: string;     // Rule/heuristic yang digunakan
  input?: string;   // Input data (optional)
  output?: string;  // Output result (optional)
}
```

**Evidence Sources:**
- **ModelColumnResolver**: Database schema lookup
- **AccessorResolver**: Laravel accessor methods
- **SemanticKernelV2**: Core semantic rules
- **CastResolver**: Laravel model casts
- **RelationResolver**: Eloquent relationships
- **ResourceResolver**: API resource analysis
**📋 TraceNode Examples:**
```typescript
// Database column evidence
const columnTrace: TraceNode = {
  source: 'ModelColumnResolver',
  rule: 'Field lookup from Schema Model User.created_at',
  input: 'created_at',
  output: 'datetime'
};

// Laravel cast evidence  
const castTrace: TraceNode = {
  source: 'CastResolver',
  rule: 'Model cast users.settings → array',
  input: 'settings',
  output: 'array'
};

// Eloquent relation evidence
const relationTrace: TraceNode = {
  source: 'RelationResolver', 
  rule: 'hasMany relationship User → Posts',
  input: 'posts',
  output: 'collection'
};

// Heuristic evidence (lower confidence)
const heuristicTrace: TraceNode = {
  source: 'SemanticKernelV2',
  rule: 'Property name pattern ends with _at → datetime',
  input: 'updated_at',
  output: 'datetime'
};

// API resource evidence
const resourceTrace: TraceNode = {
  source: 'ResourceResolver',
  rule: 'UserResource::toArray() field mapping',
  input: 'user_name', 
  output: 'string'
};
```

### 3. SemanticResolution — Core Resolution Structure

```typescript
interface SemanticResolution {
  status: ResolutionStatus;     // Resolution status
  type: string;                 // Final type ('string', 'number', 'model', etc)
  model?: string;               // Model name (jika type='model')
  resource?: string;            // Resource name (jika type='resource')
  collection?: boolean;         // Array/collection flag
  paginated?: boolean;          // Laravel pagination wrapper
  nullable?: boolean;           // Can be null
  confidence: number;           // Confidence score (0-100)
  trace: TraceNode[];          // Evidence trail
  fields?: Record<string, string>; // For synthetic objects
}
```

**📋 SemanticResolution Examples:**
```typescript
// Simple primitive resolution
const stringResolution: SemanticResolution = {
  status: 'resolved',
  type: 'string',
  nullable: false,
  confidence: 95,
  trace: [
    { source: 'DatabaseSchema', rule: 'Column users.name → VARCHAR(255) NOT NULL' }
  ]
};

// Model collection resolution
const userCollectionResolution: SemanticResolution = {
  status: 'resolved',
  type: 'model',
  model: 'User',
  collection: true,
  paginated: false,
  nullable: false,
  confidence: 100,
  trace: [
    { source: 'RelationResolver', rule: 'hasMany relationship Company → Users' },
    { source: 'EloquentMethod', rule: 'Method ->users() returns Collection<User>' }
  ]
};

// Resource response resolution
const resourceResolution: SemanticResolution = {
  status: 'resolved',
  type: 'resource',
  resource: 'UserResource',
  collection: false,
  nullable: false,
  confidence: 90,
  trace: [
    { source: 'ControllerAnalysis', rule: 'Return new UserResource($user)' },
    { source: 'ResourceResolver', rule: 'UserResource found in app/Http/Resources/' }
  ]
};

// Synthetic object resolution (e.g. Sanctum createToken())
const syntheticObjectResolution: SemanticResolution = {
  status: 'resolved',
  type: 'object',
  nullable: false,
  confidence: 85,
  fields: {
    'accessToken': 'string',
    'plainTextToken': 'string', 
    'token': 'object'
  },
  trace: [
    { source: 'SanctumResolver', rule: 'createToken() returns object with known fields' }
  ]
};
```

### 4. AccessKind — Property Access Types

```typescript
type AccessKind = 'array_access' | 'property_access' | 'optional_access'
```

**Access Patterns:**
- **property_access**: Standard `$obj->property` atau `obj.property`
- **array_access**: Array notation `$obj['key']` atau `obj[key]`
- **optional_access**: Nullsafe `$obj?->property` atau `obj?.property`

### 5. JsonObjectResolution — Laravel JSON Field Support

```typescript
interface JsonObjectResolution extends SemanticResolution {
  type: 'json-object';
  sourceModel: string;     // Origin model (e.g., 'User')
  sourceColumn: string;    // Origin column (e.g., 'metadata')
}
```

**Tujuan:** Handle Laravel JSON/array casts yang complex structure tidak diketahui at compile time
**📋 JsonObjectResolution Example:**
```typescript
// Model User dengan JSON column 'settings'
const jsonObjectResolution: JsonObjectResolution = {
  type: 'json-object',
  status: 'resolved',
  sourceModel: 'User',
  sourceColumn: 'settings',
  nullable: true,
  confidence: 80,
  trace: [
    { source: 'CastResolver', rule: 'Model cast users.settings → json' },
    { source: 'DatabaseSchema', rule: 'Column users.settings → JSON' }
  ]
};

// Generated Zod schema:
// settingsSchema: z.record(z.unknown()).nullable()
```

### 6. JsonMemberResolution — Nested JSON Access

```typescript
interface JsonMemberResolution extends SemanticResolution {
  type: 'json-member';
  parent: SemanticResolution;  // Parent JSON object
  key: string;                 // Accessed key
  accessKind: AccessKind;      // Access pattern
}
```

**Tujuan:** Track nested access dalam JSON objects dengan linked-list chain

**📋 JsonMemberResolution Example:**
```typescript
// PHP: $user->settings['theme']['color']
// Chain: user -> settings -> theme -> color

// Step 1: $user->settings
const settingsAccess: JsonObjectResolution = {
  type: 'json-object',
  status: 'resolved',
  sourceModel: 'User',
  sourceColumn: 'settings',
  confidence: 80,
  trace: [{ source: 'CastResolver', rule: 'Model cast → json' }]
};

// Step 2: settings['theme']
const themeAccess: JsonMemberResolution = {
  type: 'json-member',
  status: 'partial',
  parent: settingsAccess,
  key: 'theme',
  accessKind: 'array_access',
  confidence: 60,
  trace: [{ source: 'JsonAccessResolver', rule: 'Array access on json-object' }]
};

// Step 3: theme['color']
const colorAccess: JsonMemberResolution = {
  type: 'json-member',
  status: 'partial',
  parent: themeAccess,
  key: 'color',
  accessKind: 'array_access',
  confidence: 40,  // Lower confidence untuk nested access
  trace: [{ source: 'JsonAccessResolver', rule: 'Nested array access on json-member' }]
};
```

---

## 🔄 CONFIDENCE SCORING SYSTEM

### Confidence Levels & Meaning

| Range | Level | Meaning | Example Sources |
|-------|-------|---------|-----------------|
| 90-100 | **High** | Direct evidence dari authoritative source | Database schema, explicit casts |
| 70-89 | **Medium** | Strong heuristics atau indirect evidence | Property patterns, method signatures |
| 50-69 | **Low** | Weak heuristics atau guessing | Name patterns, context clues |
| 25-49 | **Very Low** | Speculative inference | Fallback rules, default assumptions |
| 0-24 | **Unknown** | No reliable evidence | Complex expressions, dynamic code |

### Confidence Calculation Rules

**📋 Confidence Calculation Examples:**
```typescript
// High confidence: Direct database evidence
function calculateDatabaseColumnConfidence(column: DatabaseColumn): number {
  let confidence = 100;  // Start dengan perfect
  
  if (column.nullable) confidence -= 5;     // Nullable adds uncertainty
  if (!column.hasIndex) confidence -= 5;   // No index = less important?
  if (column.isGeneric) confidence -= 10;  // Generic names less reliable
  
  return Math.max(confidence, 90);  // Minimum 90 untuk database evidence
}

// Medium confidence: Pattern matching
function calculatePatternConfidence(propertyName: string): number {
  let confidence = 70;  // Base pattern confidence
  
  if (propertyName.endsWith('_at')) confidence += 10;  // Strong datetime pattern
  if (propertyName.endsWith('_id')) confidence += 10;  // Strong ID pattern
  if (propertyName.includes('password')) confidence += 5;  // Likely string
  if (propertyName.length < 3) confidence -= 10;  // Short names ambiguous
  
  return Math.min(confidence, 89);  // Cap at medium level
}

// Low confidence: Nested JSON access
function calculateJsonMemberConfidence(depth: number, parentConfidence: number): number {
  const depthPenalty = depth * 10;  // Each level reduces confidence
  const baseConfidence = Math.max(parentConfidence - depthPenalty, 20);
  
  return Math.min(baseConfidence, 69);  // Cap at low level
}
```

### Evidence Aggregation

**Multiple Evidence Sources:**
```typescript
function aggregateEvidence(traces: TraceNode[]): number {
  if (traces.length === 0) return 0;
  
  const weights = {
    'DatabaseSchema': 1.0,      // Highest weight
    'CastResolver': 0.9,        // High weight
    'RelationResolver': 0.8,    // High weight  
    'ResourceResolver': 0.7,    // Medium-high weight
    'AccessorResolver': 0.6,    // Medium weight
    'PatternMatcher': 0.4,      // Lower weight
    'Heuristic': 0.2           // Lowest weight
  };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  traces.forEach(trace => {
    const weight = weights[trace.source] || 0.1;
    totalWeight += weight;
    weightedSum += weight * getTraceConfidence(trace);
  });
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}
```

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Evidence-Based Resolution:**
```typescript
// BENAR: Build evidence trail step by step
function resolveUserProperty(propertyName: string): SemanticResolution {
  const traces: TraceNode[] = [];
  let confidence = 0;
  let type = 'unknown';
  
  // Check database schema first (highest confidence)
  const dbColumn = findDatabaseColumn('users', propertyName);
  if (dbColumn) {
    traces.push({
      source: 'DatabaseSchema',
      rule: `Column users.${propertyName} → ${dbColumn.type}`,
      input: propertyName,
      output: mapSqlType(dbColumn.type)
    });
    confidence = calculateDatabaseColumnConfidence(dbColumn);
    type = mapSqlType(dbColumn.type);
  }
  
  // Check model casts (high confidence)
  const cast = findModelCast('User', propertyName);
  if (cast) {
    traces.push({
      source: 'CastResolver',
      rule: `Model cast users.${propertyName} → ${cast}`,
      input: propertyName,
      output: mapCastType(cast)
    });
    // Cast overrides database type
    confidence = Math.max(confidence, 90);
    type = mapCastType(cast);
  }
  
  // Fallback to pattern matching (lower confidence)
  if (confidence === 0) {
    traces.push({
      source: 'PatternMatcher',
      rule: `Property name pattern: ${propertyName}`,
      input: propertyName,
      output: inferTypeFromName(propertyName)
    });
    confidence = calculatePatternConfidence(propertyName);
    type = inferTypeFromName(propertyName);
  }
  
  return {
    status: confidence > 70 ? 'resolved' : (confidence > 40 ? 'partial' : 'unknown'),
    type,
    confidence,
    trace: traces
  };
}
```
**2. Immutable Resolution Construction:**
```typescript
// BENAR: Immutable resolution dengan proper composition
function enhanceResolution(
  base: SemanticResolution,
  additionalTrace: TraceNode,
  confidenceBoost: number = 0
): SemanticResolution {
  return {
    ...base,
    confidence: Math.min(base.confidence + confidenceBoost, 100),
    trace: [...base.trace, additionalTrace]  // Append, tidak mutate
  };
}

// BENAR: Compose multiple resolutions
function mergeResolutions(
  primary: SemanticResolution,
  secondary: SemanticResolution
): SemanticResolution {
  // Primary resolution wins, secondary adds evidence
  return {
    ...primary,
    confidence: Math.max(primary.confidence, secondary.confidence),
    trace: [...primary.trace, ...secondary.trace]
  };
}
```

**3. Type-Safe JsonMember Chain Construction:**
```typescript
// BENAR: Build JSON member chain dengan proper typing
function buildJsonMemberChain(
  baseObject: JsonObjectResolution,
  accessPath: { key: string; kind: AccessKind }[]
): JsonMemberResolution {
  let current: SemanticResolution = baseObject;
  let depth = 0;
  
  for (const access of accessPath) {
    depth++;
    const parentConfidence = current.confidence;
    
    current = {
      type: 'json-member',
      status: depth > 2 ? 'unknown' : 'partial',  // Deep access becomes unknown
      parent: current,
      key: access.key,
      accessKind: access.kind,
      confidence: calculateJsonMemberConfidence(depth, parentConfidence),
      trace: [
        ...current.trace,
        {
          source: 'JsonAccessResolver',
          rule: `${access.kind} on ${current.type}`,
          input: access.key,
          output: 'json-member'
        }
      ]
    } as JsonMemberResolution;
  }
  
  return current as JsonMemberResolution;
}
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Resolution tanpa Evidence:**
```typescript
// SALAH: Black box resolution
function badResolution(code: string): SemanticResolution {
  return {
    status: 'resolved',
    type: 'string',  // No evidence why
    confidence: 80,  // Arbitrary confidence
    trace: []        // Empty trace!
  };
}

// BENAR: Evidence-based resolution
function goodResolution(code: string, context: ResolutionContext): SemanticResolution {
  const traces: TraceNode[] = [];
  // ... build evidence step by step
  
  return {
    status: 'resolved',
    type: 'string',
    confidence: calculateConfidence(traces),
    trace: traces  // Complete evidence trail
  };
}
```
**2. Mutating Existing Resolutions:**
```typescript
// SALAH: Mutating resolution
function badEnhancement(resolution: SemanticResolution, newTrace: TraceNode): void {
  resolution.trace.push(newTrace);  // JANGAN! Mutation
  resolution.confidence += 10;      // JANGAN! Side effects
}

// BENAR: Immutable enhancement
function goodEnhancement(
  resolution: SemanticResolution, 
  newTrace: TraceNode
): SemanticResolution {
  return {
    ...resolution,
    confidence: Math.min(resolution.confidence + 10, 100),
    trace: [...resolution.trace, newTrace]
  };
}
```

**3. Ignoring Confidence Levels:**
```typescript
// SALAH: Treat semua resolution sama
function badUsage(resolution: SemanticResolution): void {
  if (resolution.type === 'string') {
    // Use sebagai definitive string, ignore confidence!
    generateStringType();
  }
}

// BENAR: Respect confidence levels
function goodUsage(resolution: SemanticResolution): void {
  if (resolution.confidence > 80 && resolution.type === 'string') {
    generateStringType();  // High confidence
  } else if (resolution.confidence > 50) {
    generateStringTypeWithFallback();  // Medium confidence
  } else {
    generateUnknownType();  // Low confidence
  }
}
```

---

## 🔍 DEBUGGING & VALIDATION

### Resolution Analysis Tools

```typescript
// Analyze resolution quality
function analyzeResolution(resolution: SemanticResolution): ResolutionAnalysis {
  return {
    qualityScore: calculateQualityScore(resolution),
    evidenceStrength: analyzeEvidenceStrength(resolution.trace),
    confidenceJustification: justifyConfidence(resolution),
    improvementSuggestions: suggestImprovements(resolution)
  };
}

function calculateQualityScore(resolution: SemanticResolution): number {
  let score = resolution.confidence;
  
  // Bonus untuk complete trace
  if (resolution.trace.length > 0) score += 5;
  if (resolution.trace.length > 2) score += 5;  // Multiple evidence sources
  
  // Bonus untuk authoritative sources
  const hasAuthoritative = resolution.trace.some(t => 
    ['DatabaseSchema', 'CastResolver', 'RelationResolver'].includes(t.source)
  );
  if (hasAuthoritative) score += 10;
  
  // Penalty untuk inconsistent evidence
  const hasInconsistent = checkEvidenceConsistency(resolution.trace);
  if (hasInconsistent) score -= 20;
  
  return Math.max(Math.min(score, 100), 0);
}
```

### Trace Visualization

```typescript
// Visualize evidence trail untuk debugging
function visualizeTrace(resolution: SemanticResolution): string {
  const lines: string[] = [
    `Resolution: ${resolution.type} (${resolution.confidence}% confidence)`,
    `Status: ${resolution.status}`,
    '',
    'Evidence Trail:'
  ];
  
  resolution.trace.forEach((trace, index) => {
    lines.push(`  ${index + 1}. ${trace.source}: ${trace.rule}`);
    if (trace.input && trace.output) {
      lines.push(`     Input: ${trace.input} → Output: ${trace.output}`);
    }
  });
  
  return lines.join('\n');
}

// Example output:
/*
Resolution: string (95% confidence)
Status: resolved

Evidence Trail:
  1. DatabaseSchema: Column users.name → VARCHAR(255) NOT NULL
     Input: name → Output: string
  2. CastResolver: Model cast users.name → string
     Input: name → Output: string
*/
```

### Resolution Validation

```typescript
function validateResolution(resolution: SemanticResolution): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Required fields
  if (!resolution.status) errors.push('Missing status');
  if (!resolution.type) errors.push('Missing type');
  if (resolution.confidence < 0 || resolution.confidence > 100) {
    errors.push('Invalid confidence range');
  }
  
  // Trace validation
  if (resolution.trace.length === 0 && resolution.status === 'resolved') {
    warnings.push('Resolved status without evidence trace');
  }
  
  // Consistency checks
  if (resolution.status === 'resolved' && resolution.confidence < 50) {
    warnings.push('Low confidence for resolved status');
  }
  
  if (resolution.type === 'model' && !resolution.model) {
    errors.push('Model type without model name');
  }
  
  if (resolution.type === 'resource' && !resolution.resource) {
    errors.push('Resource type without resource name');
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

### SemanticKernel Integration

```typescript
// SemanticKernelV2 produces SemanticResolution
class SemanticKernelV2 {
  resolve(field: FieldNode, context: ResolutionContext): SemanticResolution {
    // Apply resolution rules dengan evidence tracking
    const resolution = this.applyResolutionRules(field, context);
    
    // Validate sebelum return
    const validation = validateResolution(resolution);
    if (!validation.valid) {
      console.warn('Invalid resolution:', validation.errors);
    }
    
    return resolution;
  }
}
```

### Generator Integration

```typescript
// Generators consume SemanticResolution untuk type-safe code generation
class ZodContractGenerator {
  generateFieldSchema(field: FieldNode): string {
    if (!field.resolved) {
      return 'z.unknown()';  // No resolution available
    }
    
    const resolution = field.resolved;
    
    // Respect confidence levels
    if (resolution.confidence < 50) {
      return 'z.unknown()';  // Low confidence → unknown
    }
    
    // Generate based on resolved type
    switch (resolution.type) {
      case 'string':
        return this.generateStringSchema(resolution);
      case 'number':
        return this.generateNumberSchema(resolution);
      case 'model':
        return this.generateModelSchema(resolution);
      case 'json-object':
        return this.generateJsonObjectSchema(resolution as JsonObjectResolution);
      default:
        return 'z.unknown()';
    }
  }
  
  private generateJsonObjectSchema(resolution: JsonObjectResolution): string {
    // Generate z.record(z.unknown()) dengan proper nullability
    const base = 'z.record(z.unknown())';
    return resolution.nullable ? `${base}.nullable()` : base;
  }
}
```

---

## 📋 EXTENSION GUIDELINES

### Adding New Resolution Types

**1. Extend SemanticResolution:**
```typescript
// Add new specialized resolution
interface CustomServiceResolution extends SemanticResolution {
  type: 'service';
  serviceName: string;
  serviceMethod: string;
  parameters: Record<string, string>;
}
```

**2. Update Resolution Logic:**
```typescript
class CustomServiceResolver {
  resolve(serviceCall: ServiceCallNode): CustomServiceResolution {
    return {
      type: 'service',
      status: 'resolved',
      serviceName: serviceCall.className,
      serviceMethod: serviceCall.methodName,
      parameters: this.analyzeParameters(serviceCall),
      confidence: 85,
      trace: [
        {
          source: 'ServiceResolver',
          rule: `Service method call: ${serviceCall.className}::${serviceCall.methodName}`,
          input: serviceCall.className,
          output: 'service'
        }
      ]
    };
  }
}
```

### Adding New Evidence Sources

**1. Create New Resolver:**
```typescript
class CustomFrameworkResolver {
  source = 'CustomFrameworkResolver';
  
  resolve(field: FieldNode, context: ResolutionContext): SemanticResolution | null {
    if (!this.canResolve(field)) return null;
    
    const evidence = this.gatherEvidence(field, context);
    
    return {
      status: 'resolved',
      type: evidence.type,
      confidence: this.calculateConfidence(evidence),
      trace: [
        {
          source: this.source,
          rule: evidence.rule,
          input: field.originalCode,
          output: evidence.type
        }
      ]
    };
  }
}
```

**2. Register dengan SemanticKernel:**
```typescript
class SemanticKernelV2 {
  private resolvers = [
    new DatabaseResolver(),
    new CastResolver(),
    new RelationResolver(),
    new CustomFrameworkResolver()  // New resolver
  ];
}
```

---

## 🚀 PERFORMANCE & OPTIMIZATION

### Resolution Caching

```typescript
// Cache resolutions untuk identical fields
const resolutionCache = new Map<string, SemanticResolution>();

function getCachedResolution(
  field: FieldNode,
  context: ResolutionContext
): SemanticResolution | null {
  const cacheKey = computeResolutionKey(field, context);
  return resolutionCache.get(cacheKey) || null;
}

function cacheResolution(
  field: FieldNode,
  context: ResolutionContext,
  resolution: SemanticResolution
): void {
  const cacheKey = computeResolutionKey(field, context);
  resolutionCache.set(cacheKey, resolution);
}
```

### Confidence Optimization

```typescript
// Early termination untuk high-confidence resolutions
function optimizedResolve(field: FieldNode, context: ResolutionContext): SemanticResolution {
  // Try high-confidence resolvers first
  const dbResolution = tryDatabaseResolver(field, context);
  if (dbResolution && dbResolution.confidence > 90) {
    return dbResolution;  // Early termination
  }
  
  const castResolution = tryCastResolver(field, context);
  if (castResolution && castResolution.confidence > 85) {
    return mergeResolutions(dbResolution, castResolution);
  }
  
  // Continue dengan lower-confidence resolvers...
  return fallbackResolve(field, context);
}
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### Resolution Quality Metrics

| Metric | Target | Purpose |
|--------|--------|---------|
| Average Confidence | >80% | High-quality resolutions |
| Resolved Status Ratio | >85% | Most fields successfully resolved |
| Evidence Completeness | >90% | All resolutions have trace |
| Trace Consistency | >95% | No contradictory evidence |
| Resolution Speed | <10ms/field | Performance target |

### Evidence Quality Indicators

- **Source Authority**: 100% resolutions use authoritative sources when available
- **Trace Completeness**: 0% resolved resolutions without evidence
- **Confidence Accuracy**: Confidence correlates dengan actual correctness
- **JSON Path Tracking**: 100% JSON access chains fully tracked
- **Resolution Stability**: Same input produces same resolution

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/core/src/types/field.ts` - FieldNode system
- `packages/core/src/types/semantic.ts` - Semantic type definitions
- `packages/cli/src/resolvers/` - Resolution implementations

### Consumers (Downstream)
- `packages/cli/src/generators/` - Code generation dari resolutions
- `packages/cli/src/generators/layers/` - Layer-specific code generation
- Debugging tools - Resolution analysis dan visualization

### Configuration Files
- `packages/core/tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Test configuration untuk resolution tests

---

**Sistem contract & semantic resolution adalah jantung dari RouteSync's evidence-based type inference. Memahami struktur ini essential untuk maintaining accuracy, traceability, dan confidence dalam generated code.**

**Last Updated:** Juli 26, 2026  
**Contract Version:** v2  
**Status:** Core Infrastructure dengan active development