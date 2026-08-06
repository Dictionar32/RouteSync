# Design Document: Scanner-Compiler-Writers Architecture Refactoring

## Executive Summary

This design refactors RouteSync's monolithic architecture into a **three-layer pipeline**:

1. **Scanner Layer** - Extracts raw facts from Laravel without inference
2. **Compiler Layer** - Performs all semantic analysis and produces typed artifacts  
3. **Writers Layer** - Consumes artifacts and generates backend outputs

### Key Benefits

| Aspect | Current | After Refactoring |
|--------|---------|-------------------|
| **Separation of Concerns** | Mixed (parser + compiler + generator) | Clean layering (Scanner → Compiler → Writers) |
| **Single Source of Truth** | Multiple (parser state + manifest) | ArtifactRegistry (unified artifact storage) |
| **Type Safety** | Partial (mixed types in parser) | Full (typed artifacts via TypedArtifact pattern) |
| **Testability** | Hard (dependencies tangled) | Easy (each layer independently testable) |
| **Extensibility** | Difficult (new writer needs parser changes) | Simple (add writer, no parser changes) |
| **Maintainability** | Complex (2000+ line parser) | Modular (each component <500 lines) |

### Problem Statement

**Current Architecture Issues:**

1. **LaravelRouteParser Too Large** (~2000 lines)
   - Mixes fact extraction with semantic analysis
   - Difficult to test in isolation
   - Hard to extend with new analysis

2. **Manifest Intermediate State**
   - Acts as temporary storage during generation
   - Becomes inconsistent between parser and compiler
   - No contract for what manifest represents

3. **Multiple Sources of Truth**
   - Parser has response type inference logic
   - Compiler has separate type resolution logic
   - Writers have formatting/transformation logic
   - Inconsistencies when any layer changes

### Solution Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      Laravel Project                             │
│  routes/api.php  Controllers  Resources  Models  FormRequests    │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │   Scanner (Fact Extraction)   │
                    │  No inference, just facts     │
                    │  Output: Raw manifest         │
                    └──────────────┬────────────────┘
                                   │
               ┌───────────────────▼────────────────────┐
               │  Compiler (Semantic Analysis)          │
               │  All inference here                    │
               │  Uses compiler IR & passes             │
               │  Output: ArtifactRegistry              │
               └───────────────────┬────────────────────┘
                                   │
      ┌────────────────┬───────────┴─────────┬─────────────┐
      │                │                     │             │
      ▼                ▼                     ▼             ▼
 ManifestWriter TypeScriptWriter        SDKWriter    OpenAPIWriter
 (routesync.    (types.ts, api.ts,      (client.ts)  (openapi.json)
  manifest.json) hooks.ts, etc)
```

## Architecture Components

### Layer 1: Scanner

**Purpose:** Extract raw facts from Laravel without performing inference

**Components:**
- `LaravelRouteScanner` - Parse routes/api.php
- `ControllerMethodScanner` - Extract method signatures via reflection
- `ResourceScanner` - Identify Resource classes
- `FormRequestScanner` - Parse validation rules
- `ModelScanner` - Extract database schema

**Output Contract:**
```typescript
interface RawManifest {
  version: string
  routes: RawRoute[]
  models: RawModel[]
  resources: RawResource[]
  validations: ValidationRule[]
  
  // NO INFERENCE - raw facts only
  // NO response.kind - leave for compiler to infer
  // NO derived names - just raw data
}

interface RawRoute {
  name: string
  method: string
  path: string
  controller: string
  action: string
  middleware: string[]
  
  // Raw metadata only - no type inference
  returnStatement: string        // Raw PHP code
  methodSourceCode: string       // Raw method body
  methodDocblock: string         // Raw phpdoc
  attributes: PhpAttribute[]     // PHP 8 attributes
}
```

**Key Constraint:** Scanner outputs are **deterministic and immutable**. No timestamp variations, content-based only.

### Layer 2: Compiler

**Purpose:** All semantic analysis and type resolution

**Architecture:**

```
┌─────────────────────────────────────────────────────────┐
│           CompilationContext                            │
│  • ArtifactRegistry - unified artifact storage          │
│  • PassManager - orchestrates analysis                  │
│  • CompilationState - tracks pass dependencies          │
└─────────────────────────────────────────────────────────┘
            ▲
            │ uses
            │
┌─────────────────────────────────────────────────────────┐
│                  Analysis Passes                        │
├─────────────────────────────────────────────────────────┤
│ 1. ResponseAnalysisPass (infer response types)          │
│ 2. ValidationAnalysisPass (infer Zod schemas)           │
│ 3. ResourceAnalysisPass (identify resources)            │
│ 4. RouteAnalysisPass (build route artifacts)            │
│ 5. ModelAnalysisPass (extract model schemas)            │
│ 6. ArtifactIntegrationPass (cross-reference checks)     │
└─────────────────────────────────────────────────────────┘
```

**Artifact Family** (outputs of compiler):

1. **ResponseArtifact** - Response type and shape analysis
   - Transport type (resource, model, json, primitive, binary)
   - Response body structure
   - Confidence score with reasoning

2. **ValidationArtifact** - Form validation rules
   - Extracted from FormRequest classes
   - Zod-compatible rule format

3. **ResourceArtifact** - Resource class metadata
   - Properties and types
   - Model mapping
   - Conditional attributes

4. **ModelArtifact** - Database model metadata
   - Table structure
   - Column types
   - Relationships

5. **RouteArtifact** - Complete route definition
   - HTTP method and path
   - Controller and action
   - References to other artifacts
   - Authentication and middleware

**Key Principle:** Artifacts are **pure analysis results only** - no backend-specific concerns, no transformation logic, no naming decisions.

### Layer 3: Writers

**Purpose:** Consume artifacts and generate backend outputs

**Writers Available:**

1. **ManifestWriter**
   - Input: ArtifactRegistry
   - Output: routesync.manifest.json
   - Maintains backward compatibility

2. **TypeScriptWriter**
   - Input: ArtifactRegistry
   - Output: types.ts, api.ts
   - Full TypeScript type definitions

3. **SDKWriter**
   - Input: ArtifactRegistry
   - Output: client.ts, hooks.ts
   - React Query and Vue Query integrations

4. **OpenAPIWriter**
   - Input: ArtifactRegistry
   - Output: openapi.json
   - OpenAPI 3.0 specification

5. **ZodWriter**
   - Input: ArtifactRegistry
   - Output: schemas.ts
   - Zod validation schemas

**Writer Interface:**

```typescript
interface Writer {
  name: string
  supportedFormats: string[]
  
  canWrite(artifact: Artifact): boolean
  write(registry: ArtifactRegistry): GeneratedFile[]
}
```

## Data Flow

### Complete Pipeline

```
1. INPUT
   └─ Laravel project loaded
   
2. SCANNER (Fact Extraction)
   ├─ Parse routes/api.php → RawRoute[]
   ├─ Reflect methods → MethodSignature[]
   ├─ Scan resources → ResourceDefinition[]
   ├─ Parse validation → ValidationRules[]
   └─ Query models → ModelSchema[]
   │
   └─→ Output: RawManifest (deterministic JSON)
   
3. COMPILER (Semantic Analysis)
   ├─ Load RawManifest
   ├─ Pass 1: ResponseAnalysisPass
   │  └─→ ResponseArtifact[] (infer types)
   ├─ Pass 2: ValidationAnalysisPass
   │  └─→ ValidationArtifact[] (Zod schemas)
   ├─ Pass 3: ResourceAnalysisPass
   │  └─→ ResourceArtifact[] (resource metadata)
   ├─ Pass 4: ModelAnalysisPass
   │  └─→ ModelArtifact[] (DB schemas)
   ├─ Pass 5: RouteAnalysisPass
   │  └─→ RouteArtifact[] (complete routes)
   ├─ Pass 6: ArtifactIntegrationPass
   │  └─→ Validate cross-references
   │
   └─→ Output: ArtifactRegistry (single source of truth)
   
4. WRITERS (Code Generation)
   ├─ ManifestWriter → routesync.manifest.json
   ├─ TypeScriptWriter → types.ts, api.ts
   ├─ SDKWriter → client.ts, hooks.ts
   ├─ OpenAPIWriter → openapi.json
   └─ ZodWriter → schemas.ts
```

## Detailed Component Design

### Scanner: LaravelRouteScanner

**Responsibility:** Extract facts from routes/api.php without inference

**Implementation:**

```typescript
interface LaravelRouteScanner {
  scanRoutes(projectPath: string): Promise<RawRoute[]>
  
  // Low-level: just parse PHP code
  getRouteDefinitions(): RouteDefinition[]
  
  // Extract what we know from reflection
  getControllerMethods(): ControllerMethod[]
  
  // No inference - just raw return statements
  getRawReturnStatements(controller: string, method: string): string[]
}
```

**What NOT to do:**
- ❌ Infer response types
- ❌ Determine if collection or single
- ❌ Resolve model names
- ❌ Derive any TypeScript types

**What TO do:**
- ✅ Parse route definitions
- ✅ Extract method names and paths
- ✅ Get raw PHP source code
- ✅ Extract docblocks as strings

### Compiler: ResponseAnalysisPass

**Responsibility:** Infer response types from raw method source

**Implementation:**

```typescript
class ResponseAnalysisPass implements CompilerPass {
  async run(context: CompilationContext, manifest: RawManifest): Promise<ResponseArtifact[]> {
    // Use StatementIRLayer to parse method source
    const artifacts: ResponseArtifact[] = []
    
    for (const route of manifest.routes) {
      const statements = await this.parseMethodSource(route.methodSourceCode)
      const responseType = this.inferResponseType(statements, route)
      
      artifacts.push(new ResponseArtifactBuilder()
        .id(`${route.controller}.${route.action}.Response`)
        .resource(...)
        .confidence(score, reason)
        .build())
    }
    
    return artifacts
  }
  
  private inferResponseType(statements: Statement[], route: RawRoute): ResponseType {
    // All inference logic HERE - not in scanner
    // Uses compiler's type system for resolution
    // Returns typed ResponseArtifact
  }
}
```

**What NOT to do:**
- ❌ Use regex on PHP source
- ❌ Parse PHP inline
- ❌ Do incomplete analysis

**What TO do:**
- ✅ Use StatementIRLayer for proper parsing
- ✅ Apply 7-stage inference pipeline
- ✅ Track confidence scores
- ✅ Handle edge cases explicitly

### Writer: TypeScriptWriter

**Responsibility:** Generate TypeScript files from artifacts

**Implementation:**

```typescript
class TypeScriptWriter implements Writer {
  async write(registry: ArtifactRegistry): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = []
    
    // Generate types.ts from artifacts
    const types = this.generateTypes(registry)
    files.push(new GeneratedFile('types.ts', types))
    
    // Generate api.ts with endpoints
    const api = this.generateAPI(registry)
    files.push(new GeneratedFile('api.ts', api))
    
    // Generate hooks.ts for React Query
    const hooks = this.generateHooks(registry)
    files.push(new GeneratedFile('hooks.ts', hooks))
    
    return files
  }
  
  private generateTypes(registry: ArtifactRegistry): string {
    // Query artifacts from registry
    const responses = registry.query<ResponseArtifact>('ResponseAnalysis')
    const models = registry.query<ModelArtifact>('ModelAnalysis')
    
    // Generate TypeScript interfaces
    return this.emitTypeDefinitions(responses, models)
  }
}
```

## Integration Points

### With Existing CLI

**No changes needed to CLI layer:**

```bash
# Scanner stage
routesync scan --input routes/api.php --output manifest.raw.json

# Compiler stage (NEW - replaces old generate)
routesync compile --manifest manifest.raw.json --output artifacts.json

# Writer stage
routesync write --artifacts artifacts.json --output src/api --format typescript
# or: --format manifest, --format sdk, --format openapi
```

### With Existing Code

**Backward Compatibility:**

- Old `routesync generate` still works
- Internally:
  1. Runs scanner → raw manifest
  2. Runs compiler → artifacts
  3. Runs manifest writer → old manifest format

**Migration Path:**

Phase 1: Run both old and new paths in parallel
Phase 2: Mark old path as deprecated
Phase 3: Remove old path

## Artifact Registry: Single Source of Truth

**Why Artifacts > Manifest:**

| Aspect | Manifest | Artifact |
|--------|----------|----------|
| **Type Safety** | string/object | TypeScript class |
| **Extensibility** | Hard (new field = change schema) | Easy (new artifact type) |
| **Validation** | Manual JSON schema | Built-in class validation |
| **Query Interface** | Object property access | Typed query methods |
| **Memory Efficiency** | Full object in memory | Arena-based storage |
| **Cross-reference** | ID strings | Artifact references |

**Registry API:**

```typescript
interface ArtifactRegistry {
  // Store artifacts
  put<K extends ArtifactKey>(key: K, artifact: ArtifactRegistry[K]): void
  
  // Query artifacts
  query<T extends Artifact>(type: T['typeId']): T[]
  
  // Find by ID
  findById(id: string): Artifact | undefined
  
  // Get statistics
  getStats(): RegistryStats
  
  // Serialize for writing
  export(): ExportedArtifactRegistry
}
```

## Compatibility Considerations

### Backward Compatibility

**Manifest Format:**

```json
{
  "version": "2.0.0",
  "routes": [
    {
      "name": "users.index",
      "method": "GET",
      "path": "/users",
      "response": {
        "kind": "resource",
        "resource": "UserResource",
        "model": "User",
        "collection": true
      }
    }
  ]
}
```

Generated by `ManifestWriter` from artifacts - maintains compatibility with existing tools.

### CLI Compatibility

```bash
# Old CLI still works
routesync generate --manifest manifest.json --output src/api

# New CLI (optional)
routesync scan --input routes/api.php --output manifest.raw.json
routesync compile --manifest manifest.raw.json --output artifacts.json
routesync write --artifacts artifacts.json --output src/api --format typescript
```

## Benefits Realization

### 1. Single Source of Truth

**Before:**
```
Parser determines type → writes to manifest
Compiler reads manifest → re-analyzes → sometimes different result
Writers read manifest → apply their own logic
```

**After:**
```
Parser extracts facts → RawManifest
Compiler analyzes once → ArtifactRegistry
All writers read same artifacts
```

### 2. Separation of Concerns

**Before:**
```
LaravelRouteParser (~2000 lines)
  ├─ File I/O
  ├─ PHP reflection
  ├─ Type inference (400+ lines)
  ├─ Resource detection (300+ lines)
  ├─ Collection detection (200+ lines)
  └─ Formatting logic
```

**After:**
```
Scanner: 300 lines (facts only)
Compiler:
  ├─ ResponseAnalysisPass: 200 lines
  ├─ ResourceAnalysisPass: 150 lines
  ├─ ValidationAnalysisPass: 150 lines
  └─ Other passes: 300 lines
Writers: 200 lines each
```

### 3. Testability

Each component tested independently:

```typescript
// Scanner test
describe('LaravelRouteScanner', () => {
  it('should extract route definitions', async () => {
    const routes = await scanner.scanRoutes(testProjectPath)
    expect(routes).toHaveLength(5)
    expect(routes[0].name).toBe('users.index')
  })
})

// Compiler test
describe('ResponseAnalysisPass', () => {
  it('should infer UserResource response', async () => {
    const artifact = await pass.analyze(testMethodSource)
    expect(artifact.body.resource).toBe('UserResource')
    expect(artifact.confidence.score).toBeGreaterThan(0.9)
  })
})

// Writer test
describe('TypeScriptWriter', () => {
  it('should generate types from artifacts', async () => {
    const files = await writer.write(testRegistry)
    expect(files).toContainEqual(expect.objectContaining({ name: 'types.ts' }))
  })
})
```

### 4. Extensibility

**Adding new writer is simple:**

```typescript
class GrpcWriter implements Writer {
  async write(registry: ArtifactRegistry): Promise<GeneratedFile[]> {
    const routes = registry.query<RouteArtifact>('RouteAnalysis')
    return [new GeneratedFile('api.proto', this.emitProto(routes))]
  }
}

// Register in CLI
manager.registerWriter(new GrpcWriter())

// Use
routesync write --artifacts artifacts.json --output src/api --format grpc
```

**No changes to scanner or compiler needed!**

### 5. Maintainability

**Clear responsibilities:**

- **Scanner:** "Get the facts"
- **Compiler:** "Understand the facts"  
- **Writers:** "Use the facts to create output"

**Code organization:**

```
packages/
├── cli/
│   ├── commands/
│   │   ├── scan.ts         (orchestrate scanner)
│   │   ├── compile.ts      (orchestrate compiler)
│   │   └── write.ts        (orchestrate writers)
│   └── scanners/
│       ├── RouteScanner.ts
│       ├── ResourceScanner.ts
│       └── ModelScanner.ts
├── core/
│   ├── compiler/
│   │   ├── passes/         (analysis passes)
│   │   │   ├── ResponseAnalysisPass.ts
│   │   │   ├── ValidationAnalysisPass.ts
│   │   │   └── ...
│   │   ├── artifacts/      (artifact types)
│   │   └── registry/       (artifact storage)
│   └── writers/            (NEW)
│       ├── Writer.ts       (base interface)
│       ├── typescript/
│       ├── manifest/
│       ├── sdk/
│       └── openapi/
└── sdk/
```

## Pass Architecture Detail

### CompilerPass Interface

```typescript
interface CompilerPass<
  I extends readonly ArtifactKey[],
  O extends readonly ArtifactKey[]
> {
  // Metadata
  name: string
  
  // Dependencies
  inputs: I              // What artifacts to read
  outputs: O             // What artifacts to produce
  
  // Execution
  run(context: CompilationContext, manifest: RawManifest): Promise<CompilationResult>
}
```

### Pass Execution Order

Passes execute based on dependency graph:

```
PassGraph.resolve([
  new ResponseAnalysisPass(),
  new ResourceAnalysisPass(),
  new ValidationAnalysisPass(),
  new RouteAnalysisPass(),
  new ArtifactIntegrationPass()  // depends on all others
])

// Execution order determined by:
// 1. Input/output dependencies
// 2. Priority within same dependency level
// 3. Parallel execution where possible
```

## Error Handling & Validation

### Validation Points

1. **Scanner Output Validation**
   - RawManifest schema validation
   - File permissions and access
   - PHP syntax checking

2. **Artifact Quality Validation**
   - Confidence score checks
   - Cross-reference validation
   - Type consistency checks

3. **Writer Output Validation**
   - Generated code syntax
   - TypeScript compilation
   - Schema compatibility

### Error Recovery

```typescript
class CompilerWithRecovery {
  async compile(manifest: RawManifest): Promise<CompilationResult> {
    const results: PassResult[] = []
    
    try {
      // Run each pass with error handling
      for (const pass of passes) {
        try {
          results.push(await pass.run(context, manifest))
        } catch (error) {
          // Log error but continue
          logger.warn(`Pass ${pass.name} failed: ${error.message}`)
          results.push(PassResult.skip(pass.name))
        }
      }
    } catch (fatalError) {
      throw new CompilationError('Compilation failed', fatalError)
    }
    
    return this.compileResults(results)
  }
}
```

## Performance Considerations

### Memory Efficiency

**Arena-based Storage:**
```typescript
// Old: Full object in memory per route
routes: Array<{ properties: { ... } }>  // Duplicates

// New: Pointer-based via Arena
routes: ASTNodeId[]                       // Just IDs
data: ASTArena                            // Deduplicated
```

### Incremental Compilation

**Smart Invalidation:**

```typescript
class IncrementalCompiler {
  async compileChanged(changedFile: string): Promise<CompilationResult> {
    // Determine which routes affected
    const affectedRoutes = await this.findAffected(changedFile)
    
    // Only re-analyze those routes
    const results = await Promise.all(
      affectedRoutes.map(r => this.reanalyzeRoute(r))
    )
    
    return this.mergeResults(results)
  }
}
```

## Implementation Timeline

### Phase 1: Infrastructure (Week 1-2)

- [ ] Create artifact types (ResponseArtifact, etc.)
- [ ] Implement ArtifactRegistry
- [ ] Create Writer base interface
- [ ] Update CompilationContext for passes

### Phase 2: Scanner Refactoring (Week 3-4)

- [ ] Extract Scanner interface
- [ ] Refactor LaravelRouteParser → LaravelRouteScanner
- [ ] Create RawManifest output format
- [ ] Add scanner tests

### Phase 3: Compiler Refactoring (Week 5-6)

- [ ] Implement ResponseAnalysisPass
- [ ] Implement ValidationAnalysisPass
- [ ] Implement ResourceAnalysisPass
- [ ] Implement RouteAnalysisPass
- [ ] Add pass integration tests

### Phase 4: Writers Implementation (Week 7-8)

- [ ] Implement ManifestWriter (for backward compatibility)
- [ ] Implement TypeScriptWriter
- [ ] Implement SDKWriter
- [ ] Add writer tests

### Phase 5: Integration & Polish (Week 9-10)

- [ ] Update CLI to use new pipeline
- [ ] Performance optimization
- [ ] Documentation
- [ ] Release preparation

## Success Metrics

- [ ] LaravelRouteParser reduced from 2000 to 300 lines
- [ ] Each analyzer pass < 250 lines
- [ ] 95%+ test coverage on compiler
- [ ] Single source of truth validated
- [ ] Zero breaking changes to CLI
- [ ] 10% faster generation time (via pass optimization)
- [ ] 20% memory reduction (via Arena)

## References

- [CompilerPass Design](../compiler/passes/CompilerPass.ts)
- [Artifact Pattern](../compiler/artifacts/types.ts)
- [PassManager Orchestration](../compiler/passes/PassManager.ts)
- [Existing Design Document](./design.md)
