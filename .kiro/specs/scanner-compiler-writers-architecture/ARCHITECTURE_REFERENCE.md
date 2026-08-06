# Scanner-Compiler-Writers Architecture Reference

## System Context Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Systems                             │
├─────────────────────────────────────────────────────────────────┤
│ • Laravel Application (routes, controllers, models)             │
│ • Composer (dependency resolution)                              │
│ • PHP Reflection API (metadata extraction)                      │
│ • Database (schema information)                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ PHP reflection API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                 SCANNER LAYER                                   │
│  (Fact Extraction - No Inference)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐                                        │
│  │ LaravelRouteScanner │  Extract route definitions             │
│  └─────────────────────┘                                        │
│                                                                 │
│  ┌──────────────────────────┐                                   │
│  │ ControllerMethodScanner  │  Reflect method signatures        │
│  └──────────────────────────┘                                   │
│                                                                 │
│  ┌──────────────────┐                                           │
│  │ ResourceScanner  │  Identify Resource classes                │
│  └──────────────────┘                                           │
│                                                                 │
│  ┌──────────────────────────┐                                   │
│  │ FormRequestScanner       │  Extract validation rules         │
│  └──────────────────────────┘                                   │
│                                                                 │
│  ┌──────────────────┐                                           │
│  │ ModelScanner     │  Query database schema                    │
│  └──────────────────┘                                           │
│                                                                 │
│  Output: RawManifest (Deterministic JSON)                       │
│  • routes: RawRoute[]                                           │
│  • models: RawModel[]                                           │
│  • resources: RawResource[]                                     │
│  • validations: ValidationRule[]                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ RawManifest (deterministic)
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                 COMPILER LAYER                                  │
│  (Semantic Analysis - All Inference Here)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   PassManager                            │  │
│  │  • Orchestrates pass execution                           │  │
│  │  • Manages CompilationState                              │  │
│  │  • Resolves dependencies via PassGraph                   │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                           │
│         ┌───────────┴────────────┬───────────┬────────────┐    │
│         │                        │           │            │    │
│  ┌──────▼─────────────┐  ┌──────▼──────┐  ┌──▼──────┐  ┌──▼──▼────┐
│  │ ResponseAnalysis   │  │ Resource    │  │ Validation   │ Route
│  │ Pass               │  │ Analysis    │  │ Analysis Pass│ Analysis
│  │ • Infer types      │  │ Pass        │  │ • Zod schemas│ Pass
│  │ • Type confidence  │  │ • Resource  │  │ • Rules      │ • Build
│  │ • Response kinds   │  │   metadata  │  │              │   artifacts
│  └─────────┬──────────┘  └─────┬───────┘  └──┬────────────┘ └──┬─────┘
│            │                    │             │                 │
│            └────────────────────┴─────────────┴─────────────────┘
│                                  │
│                                  │
│            ┌─────────────────────▼──────────────────┐
│            │ ArtifactIntegrationPass                │
│            │ • Validate cross-references            │
│            │ • Check consistency                    │
│            └─────────────────────┬──────────────────┘
│                                  │
│  Output: ArtifactRegistry (Single Source of Truth)              │
│  • ResponseArtifact[]                                           │
│  • ValidationArtifact[]                                         │
│  • ResourceArtifact[]                                           │
│  • ModelArtifact[]                                              │
│  • RouteArtifact[]                                              │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         │ ArtifactRegistry
                         │
        ┌────────────────┼────────────────┬────────────┐
        │                │                │            │
        │                │                │            │
   ┌────▼────────┐ ┌────▼────────┐ ┌────▼────────┐ ┌──▼──────────┐
   │ Manifest    │ │ TypeScript   │ │ SDK         │ │ OpenAPI
   │ Writer      │ │ Writer       │ │ Writer      │ │ Writer
   │             │ │              │ │             │ │
   │ routesync.  │ │ types.ts     │ │ client.ts   │ │ openapi.
   │ manifest.   │ │ api.ts       │ │ hooks.ts    │ │ json
   │ json        │ │              │ │ actions.ts  │ │
   └────┬────────┘ └────┬────────┘ └────┬────────┘ └──┬──────────┘
        │                │                │            │
        └────────────────┴────────────────┴────────────┘
                         │
                    Output Files
                    (Backend-specific)
```

## Component Ownership Matrix

| Layer | Component | Ownership | Input | Output | Dependencies |
|-------|-----------|-----------|-------|--------|--------------|
| **Scanner** | LaravelRouteScanner | CLI | Laravel paths | RawRoute[] | PHP reflection |
| **Scanner** | ControllerMethodScanner | CLI | Controllers | MethodSignature[] | PHP reflection |
| **Scanner** | ResourceScanner | CLI | App dir | Resource[] | File system |
| **Scanner** | FormRequestScanner | CLI | Requests | ValidationRule[] | PHP parsing |
| **Scanner** | ModelScanner | CLI | Models | ModelSchema[] | DB connection |
| **Compiler** | PassManager | Core | Passes | CompilationState | Pass orchestration |
| **Compiler** | ResponseAnalysisPass | Core | RawManifest | ResponseArtifact[] | Type inference |
| **Compiler** | ResourceAnalysisPass | Core | RawManifest | ResourceArtifact[] | Resource scanning |
| **Compiler** | ValidationAnalysisPass | Core | RawManifest | ValidationArtifact[] | Rule parsing |
| **Compiler** | RouteAnalysisPass | Core | RawManifest | RouteArtifact[] | Artifact refs |
| **Compiler** | ModelAnalysisPass | Core | RawManifest | ModelArtifact[] | Schema extraction |
| **Compiler** | ArtifactRegistry | Core | Artifacts | Query interface | Type registry |
| **Writer** | ManifestWriter | CLI | ArtifactRegistry | manifest.json | Format spec |
| **Writer** | TypeScriptWriter | SDK | ArtifactRegistry | types.ts, api.ts | TS codegen |
| **Writer** | SDKWriter | SDK | ArtifactRegistry | hooks.ts | React/Vue codegen |
| **Writer** | OpenAPIWriter | SDK | ArtifactRegistry | openapi.json | OAS spec |

## Data Structure Hierarchy

### RawManifest (Scanner Output)

```typescript
{
  version: "1.0.0",
  timestamp: 1704067200000,  // Deterministic for reproducibility
  
  routes: [
    {
      name: "users.index",
      method: "GET",
      path: "/users",
      controller: "UserController",
      action: "index",
      middleware: ["api"],
      
      // Raw facts only - NO INFERENCE
      returnStatement: "return UserResource::collection(User::paginate());",
      methodSourceCode: "public function index() { ... }",
      methodDocblock: "/** ... */",
      attributes: []  // PHP 8 attributes
    }
  ],
  
  models: [
    {
      name: "User",
      table: "users",
      columns: [
        { name: "id", type: "bigint", nullable: false },
        { name: "name", type: "string", nullable: false }
      ]
    }
  ],
  
  resources: [
    {
      name: "UserResource",
      model: "User",  // May be null if not detected
      properties: ["id", "name", "email"]  // Raw list from toArray()
    }
  ],
  
  validations: [
    {
      formRequest: "StoreUserRequest",
      rules: {
        "name": ["required", "string", "max:255"],
        "email": ["required", "email"]
      }
    }
  ]
}
```

### ArtifactRegistry (Compiler Output)

```typescript
interface ArtifactRegistry {
  // Artifact storage
  artifacts: Map<string, Artifact>
  
  // Query interface
  query<T extends Artifact>(type: T['typeId']): T[]
  
  // Examples of what's stored:
  // - ResponseArtifact[] (inferred response types)
  // - ValidationArtifact[] (Zod schemas)
  // - ResourceArtifact[] (resource metadata)
  // - ModelArtifact[] (DB schemas)
  // - RouteArtifact[] (complete routes)
}
```

## Pass Execution Strategy

### Dependency Graph

```
ResponseAnalysisPass (no deps)
    ↓
ResourceAnalysisPass (no deps)
ValidationAnalysisPass (no deps)
ModelAnalysisPass (no deps)
    ↓
RouteAnalysisPass (depends on all above)
    ↓
ArtifactIntegrationPass (validation pass)
```

### Execution Layers

```
Layer 1 (Parallel):
  • ResponseAnalysisPass
  • ResourceAnalysisPass
  • ValidationAnalysisPass
  • ModelAnalysisPass

Layer 2 (Sequential):
  • RouteAnalysisPass (waits for Layer 1)

Layer 3 (Final):
  • ArtifactIntegrationPass (waits for Layer 2)
```

## Writer Registration & Discovery

```typescript
// CLI writer registry
const writerRegistry: Map<string, Writer> = new Map([
  ["manifest", new ManifestWriter()],
  ["typescript", new TypeScriptWriter()],
  ["sdk", new SDKWriter()],
  ["openapi", new OpenAPIWriter()],
  ["zod", new ZodWriter()],
  ["grpc", new GrpcWriter()],  // Custom writer
])

// Writer selection
const writer = writerRegistry.get(format)
if (!writer) throw new Error(`Unknown format: ${format}`)

// Writing
const files = await writer.write(registry)
```

## Type Safety & Validation

### Artifact Type System

```typescript
type ArtifactKey = 
  | 'ResponseAnalysis'
  | 'ValidationAnalysis'
  | 'ResourceAnalysis'
  | 'ModelAnalysis'
  | 'RouteAnalysis'

interface ArtifactRegistry {
  get<K extends ArtifactKey>(key: K): ArtifactRegistry[K][]
}

type ArtifactRegistry = {
  ResponseAnalysis: ResponseArtifact[]
  ValidationAnalysis: ValidationArtifact[]
  ResourceAnalysis: ResourceArtifact[]
  ModelAnalysis: ModelArtifact[]
  RouteAnalysis: RouteArtifact[]
}
```

### Validation Layers

```
Input Validation (Scanner)
  └─> RawManifest JSON schema
  └─> File permissions
  
Artifact Validation (Compiler)
  └─> Cross-reference checks
  └─> Confidence score validation
  
Output Validation (Writers)
  └─> TypeScript syntax
  └─> Schema compliance
```

## Performance Optimization Points

### Memory Efficiency

1. **Arena-Based Storage**
   - Artifacts stored in memory-efficient Arena
   - Pointer-based references instead of full objects
   - Automatic deduplication

2. **Lazy Loading**
   - Passes load only required artifacts
   - Registry doesn't force full materialization
   - On-demand artifact construction

### Execution Speed

1. **Parallel Pass Execution**
   - Independent passes run concurrently
   - Only sequential dependencies block
   - Layer-based execution strategy

2. **Incremental Compilation**
   - Only re-analyze changed methods
   - Cache unchanged artifacts
   - Smart invalidation of dependents

### Caching Strategy

```
┌──────────────────────────────────────┐
│      Compilation Cache Hierarchy     │
├──────────────────────────────────────┤
│ Level 1: Memory (Fast)               │
│  • Current pass results              │
│  • Hot artifacts                     │
│                                      │
│ Level 2: Disk (Medium)               │
│  • Compiled artifacts                │
│  • Source analysis cache             │
│                                      │
│ Level 3: Database (Persistent)       │
│  • Long-term dependency tracking     │
│  • History for incremental builds    │
└──────────────────────────────────────┘
```

## Error Handling Strategy

### Error Categories

1. **Scanner Errors** (Recoverable)
   - Missing files → Skip route
   - PHP syntax errors → Report with location
   - Reflection failures → Fallback to defaults

2. **Compiler Errors** (Semi-recoverable)
   - Type resolution failure → Lower confidence
   - Circular dependencies → Report and continue
   - Invalid artifact → Skip dependent passes

3. **Writer Errors** (Reportable)
   - Code generation failure → Show diff
   - TypeScript compilation error → Report with line
   - File write errors → Retry with backup

### Error Recovery Modes

```
Strict Mode (CI/CD):
  • Any error → stop immediately
  • Return detailed diagnostics
  
Lenient Mode (Development):
  • Skip problematic routes
  • Continue with others
  • Report warnings with details
  
Recovery Mode (Production):
  • Use cached results if available
  • Fallback to previous version
  • Log all issues for investigation
```

## Monitoring & Observability

### Key Metrics

1. **Compilation Metrics**
   - Parse time: ms per route
   - Analysis time: ms per pass
   - Memory usage: MB peak
   - Artifact count: per type

2. **Quality Metrics**
   - Average confidence score
   - Inferred vs explicit types %
   - Coverage % (routes analyzed)
   - Error rate

3. **Performance Metrics**
   - Cache hit rate
   - Parallel efficiency
   - Generation time breakdown
   - File size trends

### Logging Points

```
SCANNER:
  INFO: Starting scan of routes
  DEBUG: Discovered 25 routes
  WARN: Unable to parse route at line 42
  
COMPILER:
  INFO: Starting compilation with 5 passes
  DEBUG: ResponseAnalysisPass completed 25/25 routes
  WARN: Low confidence (0.6) for UserController.show()
  
WRITERS:
  INFO: Generating TypeScript files
  DEBUG: Generated 5 files (42KB total)
  ERROR: TypeScript compilation failed in api.ts:10
```

## Extension Points

### Adding New Pass

```typescript
class CustomAnalysisPass implements CompilerPass {
  inputs = ['ResponseAnalysis'] as const
  outputs = ['CustomAnalysis'] as const
  
  async run(context, manifest) {
    // Access dependencies
    const responses = context.artifacts.query('ResponseAnalysis')
    
    // Perform analysis
    const results = responses.map(r => this.analyze(r))
    
    // Store artifacts
    context.artifacts.put('CustomAnalysis', results)
  }
}

// Register with PassManager
manager.registerPass(new CustomAnalysisPass())
```

### Adding New Writer

```typescript
class CustomWriter implements Writer {
  name = 'custom'
  
  async write(registry: ArtifactRegistry): Promise<GeneratedFile[]> {
    // Query artifacts
    const routes = registry.query('RouteAnalysis')
    
    // Generate custom format
    const content = this.generateCustomFormat(routes)
    
    return [new GeneratedFile('custom.txt', content)]
  }
}

// Register with CLI
writerRegistry.set('custom', new CustomWriter())
```

## Testing Strategy

### Unit Test Levels

1. **Scanner Tests**
   - Input file parsing
   - Method extraction
   - Determinism checks

2. **Pass Tests**
   - Artifact production
   - Dependency resolution
   - Confidence calculation

3. **Registry Tests**
   - Artifact storage
   - Query interface
   - Cross-references

4. **Writer Tests**
   - Code generation
   - Format compliance
   - Output validation

### Integration Test Levels

1. **End-to-End**
   - Full pipeline execution
   - Output verification
   - Performance benchmarks

2. **Cross-Layer**
   - Scanner → Compiler
   - Compiler → Writers
   - Multiple writers

3. **Backward Compatibility**
   - Old manifest format support
   - CLI compatibility
   - Migration path

## Deployment & Rollout Strategy

### Phased Rollout

**Phase 1: Development**
- New architecture runs in parallel
- Both old and new pipelines active
- Compare results

**Phase 2: Beta**
- Users opt-in to new architecture
- Flag for enabling new codegen
- Collect feedback

**Phase 3: Production**
- New architecture default
- Old architecture deprecated
- Migration window

**Phase 4: Cleanup**
- Remove old pipeline
- Full commitment to new design
