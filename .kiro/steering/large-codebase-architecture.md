# RouteSync: Large Codebase Architecture Principles (100K-1M+ LOC)

## Filosofi: Compiler-Grade Architecture

Ketika codebase tumbuh besar (100K-1M+ LOC), aturan coding berubah menjadi aturan arsitektur. RouteSync harus mengikuti prinsip yang diterapkan compiler skala besar seperti LLVM, Roslyn, Rust Compiler, atau TypeScript.

**Key Insight:** Tidak ada magic formula untuk codebase besar. Hanya ada satu cara supaya tetap maintainable: **strict architectural discipline**.

---

## The 10 Core Principles

### 1. ⭐⭐⭐⭐⭐ Single Source of Truth (SSOT)

**Rule:** Satu informasi hanya boleh memiliki satu pemilik.

**Bad Pattern:**
```typescript
// Parser detects response
const response = parseResponse(php)  // Artifact A

// Semantic detects response lagi
const response = inferResponse(model)  // Artifact B

// Generator detects response lagi
const response = analyzeResponse(ir)  // Artifact C

// ❌ Tiga sumber informasi yang berbeda!
```

**Good Pattern:**
```typescript
// Single source of truth: ResponseArtifact
class ResponseArtifact {
  type: TypeReference
  isCollection: boolean
  isPaginated: boolean
  metadata: ResponseMetadata
}

// Parser creates ResponseArtifact
parser.analyze() → ResponseArtifact

// Semantic reads ResponseArtifact
semantic.resolve(artifact)

// Generator reads ResponseArtifact
emitter.generate(artifact)

// ✅ Semua membaca dari sumber yang sama!
```

**Implementation in RouteSync:**
- `ResponseArtifact` adalah pemilik response information
- Parser hanya membuat artifact, tidak menginfer
- Semantic hanya membaca artifact, tidak mengubah
- Generator hanya menggunakan artifact, tidak menghitung ulang

**Checklist:**
- [ ] Setiap informasi domain hanya punya satu artifact
- [ ] Tidak ada duplikasi analisis di komponen berbeda
- [ ] Pass hanya reads, tidak re-analyzes
- [ ] Artifact immutable setelah creation

---

### 2. ⭐⭐⭐⭐⭐ Unidirectional Dependencies

**Rule:** Dependency hanya boleh satu arah. Tidak boleh ada panah balik.

**Bad Pattern:**
```
Scanner ↔ Analysis  // ❌ Circular!
  ↑
  └── Generator calls Scanner again
  
Analysis ← Generator ← Emitter
      ↓                 ↑
      └─────────────────┘  // ❌ Bidirectional!
```

**Good Pattern:**
```
Scanner
   ↓
Analysis
   ↓
ArtifactRegistry
   ↓
PassManager
   ↓
Emitter
   ↓
CodeWriter

// ✅ Strictly one-directional!
// No component looks backward.
```

**In RouteSync Implementation:**
```typescript
// Dependency direction must be:
// CLI → Scanner → PassManager → ArtifactRegistry → Emitter → Writer

// Never:
// Emitter → PassManager  ❌
// Writer → Artifact      ❌
// Generator → Scanner    ❌
```

**Benefits:**
- Easy to understand data flow
- No circular dependency issues
- Parallelizable (each layer independent)
- Testable in isolation

**Checklist:**
- [ ] Build dependency graph visualization
- [ ] No backward references allowed
- [ ] Each layer only imports from layer below
- [ ] No cross-layer calls within same hierarchy

---

### 3. ⭐⭐⭐⭐⭐ Pass Architecture (No Inter-Pass Communication)

**Rule:** Pass hanya berkomunikasi lewat artifact registry, tidak saling memanggil.

**Bad Pattern:**
```typescript
class ResourcePass {
  execute() {
    this.detectResource()
    this.detectCollection()      // ❌ Direct call!
    this.detectPagination()      // ❌ Direct call!
  }
}
```

**Good Pattern:**
```typescript
interface IPass {
  name: string
  dependencies: string[]  // Pass names ini depends pada
  execute(state: CompilationState): Promise<void>
}

class AnalysisManager {
  private passes: IPass[] = [
    new ResourcePass(),
    new CollectionPass(),
    new PaginationPass(),
    new ValidationPass(),
    new ResponsePass()
  ]
  
  async run(state: CompilationState) {
    // Execute passes dalam order berdasarkan dependencies
    for (const pass of this.passes) {
      await pass.execute(state)
      // Pass hanya baca dari CompilationState
      // Pass hanya tulis ke ArtifactRegistry
    }
  }
}

// ✅ Passes independent, coordinated by manager
// No pass calls another pass directly
```

**ArtifactRegistry sebagai Message Bus:**
```typescript
// Pass A writes ResponseArtifact
const responseArtifact = new ResponseArtifact(...)
state.artifacts.set(RouteKey, responseArtifact)

// Pass B reads ResponseArtifact
const responseArtifact = state.artifacts.get(RouteKey)
const isCollection = responseArtifact.isCollection

// No direct communication!
```

**Pass Execution Order Example:**
```
ScannerPass (reads PHP)
    ↓ writes RouteArtifact
ParserPass (parses route structure)
    ↓ writes ParsedRouteArtifact
ResourcePass (analyzes response resource)
    ↓ writes ResponseArtifact
SemanticPass (resolves types)
    ↓ writes ResolvedTypeArtifact
ValidationPass (extracts validation rules)
    ↓ writes ValidationArtifact
ResponseShapePass (finalizes response)
    ↓ writes FinalResponseArtifact
EmitterPass (generates code)
    ↓ writes GeneratedCode
```

**Checklist:**
- [ ] No pass calls another pass
- [ ] All communication via ArtifactRegistry
- [ ] Pass dependencies declared explicitly
- [ ] Execution order determined by dependency graph
- [ ] Each pass is stateless (reads from state, writes to registry)

---

### 4. ⭐⭐⭐⭐⭐ No `any` Type Allowed

**Rule:** Compiler-grade type safety. All types explicit, no implicit `any`.

**Bad Pattern:**
```typescript
const data: any = parseRoute(input)
const response: any = data.response
const params: any[] = response.parameters

// ❌ Type information lost everywhere!
```

**Good Pattern:**
```typescript
interface ParsedRoute {
  path: string
  method: HttpMethod
  handler: ControllerHandler
  metadata: RouteMetadata
}

interface ControllerResponse {
  type: TypeReference
  isCollection: boolean
  isPaginated: boolean
}

interface RouteParameter {
  name: string
  type: ParameterType
  required: boolean
  validation?: ValidationRule
}

const parsedRoute: ParsedRoute = parseRoute(input)
const response: ControllerResponse = parsedRoute.metadata.response
const params: RouteParameter[] = parsedRoute.metadata.parameters

// ✅ Full type information preserved
```

**Type Safety Architecture:**
```typescript
// Type registry for all domain types
class TypeEnvironment {
  private types: Map<string, TypeDefinition> = new Map()
  
  resolve(ref: TypeReference): TypeDefinition {
    const def = this.types.get(ref.name)
    if (!def) throw new UnknownTypeError(ref.name)
    return def
  }
  
  // No nullable types that could be `any`
  getOrThrow(key: string): TypeDefinition
  
  // Optional types use Option<T> pattern
  getOptional(key: string): Optional<TypeDefinition>
}
```

**Checklist:**
- [ ] No `any` type in codebase
- [ ] All artifact types explicitly defined
- [ ] TypeScript strict mode enabled
- [ ] No implicit type inference where domain type expected
- [ ] Error messages reference specific types

---

### 5. ⭐⭐⭐⭐ Immutable Artifacts

**Rule:** Artifact tidak boleh diubah setelah creation.

**Bad Pattern:**
```typescript
const artifact = createResponseArtifact(route)
artifact.isCollection = true        // ❌ Mutation!
artifact.type = newType             // ❌ Mutation!
artifact.metadata.added = value     // ❌ Indirect mutation!

// Kemudian pass lain nggak tahu artifact berubah
// Caching strategies break
// Diff detection fails
```

**Good Pattern:**
```typescript
interface ResponseArtifact {
  readonly type: TypeReference
  readonly isCollection: boolean
  readonly isPaginated: boolean
  readonly metadata: Readonly<ResponseMetadata>
}

// Untuk ubah artifact, buat artifact baru
function enrichResponseArtifact(
  artifact: ResponseArtifact,
  newMetadata: ResponseMetadata
): ResponseArtifact {
  return {
    ...artifact,
    metadata: newMetadata
  }
}

// Atau use specialized builder
class ResponseArtifactBuilder {
  private type: TypeReference
  private isCollection: boolean = false
  
  setType(type: TypeReference): this { return this }
  setCollection(flag: boolean): this { return this }
  
  build(): ResponseArtifact {
    return {
      type: this.type,
      isCollection: this.isCollection,
      // ... immutable
    }
  }
}
```

**Immutability Benefits:**
- Enables structural sharing
- Makes caching trivial (artifact == cached)
- Enables incremental builds (detect changed artifacts)
- Thread-safe (no synchronization needed)
- Enables reproducible builds (same input → same output)

**Checklist:**
- [ ] All artifact properties readonly
- [ ] Nested objects also immutable
- [ ] No mutation after creation
- [ ] Use builders for complex construction
- [ ] Spread operator for "modification" (creates new artifact)

---

### 6. ⭐⭐⭐⭐ No Layer Leakage

**Rule:** Layer tidak boleh tahu tentang layer lain. Framework agnostic.

**Bad Pattern:**
```typescript
// Scanner knows about TypeScript
class Scanner {
  detectResponse() {
    // Uses TypeScript-specific types
    const typeRef = `${model}[]` as TSType
  }
}

// Generator knows about Laravel
class Generator {
  analyze() {
    // Uses Laravel-specific patterns
    if (resource.endsWith('Resource')) {
      // Laravel-specific logic
    }
  }
}

// ❌ Coupling to specific languages/frameworks!
```

**Good Pattern:**
```typescript
// Scanner is framework-agnostic
interface IScanner {
  scan(input: unknown): ParsedArtifact[]
}

class LaravelScanner implements IScanner {
  scan(phpCode: string): ParsedArtifact[] {
    // Laravel-specific parsing
    return artifacts
  }
}

class GraphQLScanner implements IScanner {
  scan(schema: string): ParsedArtifact[] {
    // GraphQL-specific parsing
    return artifacts
  }
}

// Generator works with abstract artifacts
class CodeGenerator {
  generate(artifacts: ParsedArtifact[]): GeneratedCode[] {
    // Framework-agnostic
    // Works with any artifact type
  }
}

// ✅ Scanner and Generator independent
// Easy to add GraphQL/OpenAPI later
```

**Layer Separation:**
```
Input Layer
  ├── LaravelScanner
  ├── GraphQLScanner
  └── OpenAPIScanner
       ↓
  (Abstract ParsedArtifact)
       ↓
Analysis Layer
  ├── TypeResolver
  ├── SemanticAnalyzer
  └── ValidationAnalyzer
       ↓
  (Abstract CompilationArtifact)
       ↓
Output Layer
  ├── TypeScriptEmitter
  ├── GraphQLEmitter
  └── OpenAPIEmitter
```

**Checklist:**
- [ ] No Laravel-specific code in scanner interface
- [ ] No TypeScript-specific code in analysis layer
- [ ] Emitter works with abstract artifacts
- [ ] Easy to add new scanner without changing analysis
- [ ] Easy to add new emitter without changing scanner

---

### 7. ⭐⭐⭐⭐ No Exponential Complexity Growth

**Rule:** Setiap fitur baru tidak boleh menambah kompleksitas eksponensial.

**Bad Pattern:**
```typescript
if (featureA) {
  if (featureB) {
    if (featureC) {
      // Deep nesting, exponential branches
      if (featureD && featureE && !featureF) {
        // Impossible to test all combinations
        // Maintenance nightmare
      }
    }
  }
}

// Complexity: O(2^n) where n = number of features
// 10 features = 1024 code paths ❌
```

**Good Pattern:**
```typescript
// Register passes for each feature
class FeatureRegistry {
  private passes: Map<string, IPass> = new Map()
  
  registerFeature(name: string, pass: IPass) {
    this.passes.set(name, pass)
  }
}

// Enable features declaratively
const config = {
  features: {
    validation: true,
    relations: true,
    pagination: true,
    caching: true
  }
}

// Execute only enabled passes
for (const [feature, enabled] of Object.entries(config.features)) {
  if (enabled) {
    const pass = registry.get(feature)
    await pass.execute(state)
  }
}

// Complexity: O(n) where n = number of features
// 10 features = 10 code paths ✅
```

**Adding Features Without Exponential Growth:**
```typescript
// Instead of modifying existing code:
// ❌ if (validation) { if (zod) { if (react) { ... } } }

// Create new pass:
class ZodValidationPass implements IPass {
  execute(state: CompilationState) {
    // Focused, single responsibility
  }
}

// Register in feature registry:
registry.registerFeature('zod-validation', new ZodValidationPass())

// Enable via config:
config.features.zodValidation = true

// ✅ No exponential growth!
```

**Checklist:**
- [ ] No deeply nested conditionals based on features
- [ ] Use composition, not inheritance
- [ ] Each feature is independent pass
- [ ] Feature dependencies explicit
- [ ] Can test each feature in isolation
- [ ] Linear growth, not exponential

---

### 8. ⭐⭐⭐⭐ Open/Closed Principle (Extension Without Modification)

**Rule:** Sistem harus open for extension, closed for modification.

**Bad Pattern:**
```typescript
// Adding GraphQL support requires modifying 20 files
class ContractGenerator {
  generate(manifest: Manifest) {
    if (manifest.type === 'laravel') {
      // Laravel logic
    } else if (manifest.type === 'graphql') {
      // GraphQL logic ← Modify this file!
    } else if (manifest.type === 'openapi') {
      // OpenAPI logic ← Modify this file!
    }
    // Every new format = modify this file
  }
}

// ❌ Closed for modification!
```

**Good Pattern:**
```typescript
// Define abstract scanner interface
interface IScanner {
  scan(input: unknown): ParsedArtifact[]
}

// Implement for each format
class LaravelScanner implements IScanner {
  scan(phpCode: string): ParsedArtifact[] { /* */ }
}

class GraphQLScanner implements IScanner {
  scan(schema: string): ParsedArtifact[] { /* */ }
}

class OpenAPIScanner implements IScanner {
  scan(spec: OpenAPISpec): ParsedArtifact[] { /* */ }
}

// Register in factory
class ScannerFactory {
  create(format: string): IScanner {
    const scanners: Record<string, IScanner> = {
      'laravel': new LaravelScanner(),
      'graphql': new GraphQLScanner(),
      'openapi': new OpenAPIScanner()
    }
    return scanners[format] ?? throw new UnknownFormat(format)
  }
}

// Main generator never changes
class ContractGenerator {
  constructor(private scannerFactory: ScannerFactory) {}
  
  async generate(manifest: Manifest) {
    const scanner = this.scannerFactory.create(manifest.type)
    const artifacts = await scanner.scan(manifest.input)
    // Rest of generation...
  }
}

// Adding GraphQL:
// 1. Create GraphQLScanner class ← NEW FILE
// 2. Register in factory ← ONE LINE

// ❌ No modification to existing files!
```

**Extension Points in RouteSync:**
```
Scanner (ext: new format)
   ↓
Pass (ext: new analysis)
   ↓
ArtifactRegistry (ext: new artifact type)
   ↓
Emitter (ext: new output language)
   ↓
Formatter (ext: new code style)

Each extension is isolated, no core file changes.
```

**Checklist:**
- [ ] Adding format requires zero core file changes
- [ ] Scanner/Emitter registered in factory
- [ ] Pass system allows new passes without core changes
- [ ] Can add feature via plugin without fork
- [ ] Clear extension points documented

---

### 9. ⭐⭐⭐⭐ All Communication Via Artifact Registry

**Rule:** Components berkomunikasi hanya melalui artifact registry, bukan direct calls.

**Bad Pattern:**
```typescript
// Pass A calls Pass B directly
class ResourcePass {
  execute() {
    this.detectResource()
    // ❌ Direct call to another pass!
    const collection = new CollectionPass().execute()
    if (collection) {
      // Handle collection
    }
  }
}

// ❌ Tight coupling between passes
// ❌ Execution order implicit
// ❌ Hard to parallelize
```

**Good Pattern:**
```typescript
// Pass uses shared artifact registry
interface CompilationState {
  artifacts: ArtifactRegistry
  sources: SourceRegistry
}

class ResourcePass implements IPass {
  async execute(state: CompilationState) {
    // Read from registry
    const routes = state.artifacts.getRoutes()
    
    for (const route of routes) {
      const resource = analyzeResource(route)
      
      // Write to registry
      state.artifacts.setResponseArtifact(route.id, {
        type: resource.type,
        isCollection: false
      })
    }
  }
}

class CollectionPass implements IPass {
  async execute(state: CompilationState) {
    // Read from registry
    const responses = state.artifacts.getAllResponses()
    
    for (const response of responses) {
      if (isCollectionResponse(response)) {
        // Update artifact
        const updated = {
          ...response,
          isCollection: true
        }
        state.artifacts.updateResponseArtifact(response.id, updated)
      }
    }
  }
}

// PassManager coordinates execution
class PassManager {
  async execute(state: CompilationState) {
    // Passes never call each other
    // PassManager controls order
    for (const pass of this.passes) {
      await pass.execute(state)
    }
  }
}

// ✅ Loose coupling
// ✅ Execution order explicit
// ✅ Can parallelize passes with no dependencies
```

**Artifact Registry as Message Bus:**
```typescript
interface ArtifactRegistry {
  // Write operations
  setArtifact<T extends Artifact>(key: ArtifactKey, artifact: T): void
  updateArtifact<T extends Artifact>(key: ArtifactKey, updater: (a: T) => T): void
  
  // Read operations
  getArtifact<T extends Artifact>(key: ArtifactKey): T
  getAllArtifacts<T extends Artifact>(type: ArtifactType): T[]
  
  // Observation
  onArtifactChanged(listener: (key: ArtifactKey, artifact: Artifact) => void): void
  
  // Invalidation (for incremental builds)
  invalidate(predicate: (artifact: Artifact) => boolean): void
}

// ✅ Central hub for all component communication
// ✅ Enable caching, diffs, dependency tracking
```

**Checklist:**
- [ ] No direct pass-to-pass calls
- [ ] All communication via ArtifactRegistry
- [ ] Artifact changes observable
- [ ] Can replay artifact history
- [ ] Can detect affected artifacts on change
- [ ] Can parallelize independent passes

---

### 10. ⭐⭐⭐⭐ Don't Store Logic in Utilities

**Rule:** Avoid "god util" file dengan 3000 baris. Setiap logic punya home (class/module).

**Bad Pattern:**
```typescript
// utils.ts - grows to 3000 lines ❌
export function detectType(value) { /* */ }
export function inferSchema(model) { /* */ }
export function resolveRelation(a, b) { /* */ }
export function validateRule(rule) { /* */ }
export function formatCode(code) { /* */ }
export function optimizeAST(ast) { /* */ }
export function linkResources(resources) { /* */ }
// ... 2900 more lines
// Hard to maintain
// No logical grouping
// Hard to test
```

**Good Pattern:**
```typescript
// Each logic has dedicated class/module

// Type detection
class TypeDetector {
  detect(value: unknown): TypeReference { /* */ }
  detectCollection(value: unknown): boolean { /* */ }
}

// Schema inference
class SchemaInferencer {
  infer(model: ModelDefinition): TypeSchema { /* */ }
  inferFromResource(resource: ResourceDefinition): TypeSchema { /* */ }
}

// Relationship resolution
class RelationshipResolver {
  resolve(sourceType: TypeReference, targetType: TypeReference): Relationship { /* */ }
  detectBelongsTo(model: ModelDefinition): Relationship[] { /* */ }
}

// Validation rules
class ValidationAnalyzer {
  analyze(rules: ValidationRule[]): ValidationType { /* */ }
  toZodSchema(rules: ValidationRule[]): string { /* */ }
}

// Code formatting
class CodeFormatter {
  format(code: string, style: CodeStyle): string { /* */ }
  formatTypeScript(code: string): string { /* */ }
}

// AST optimization
class ASTOptimizer {
  optimize(ast: ExpressionNode): ExpressionNode { /* */ }
  eliminateDeadCode(ast: ExpressionNode): ExpressionNode { /* */ }
}

// Resource linking
class ResourceLinker {
  link(resources: ResourceArtifact[]): LinkedResourceGraph { /* */ }
  detectCircularDependencies(resources: ResourceArtifact[]): Dependency[] { /* */ }
}

// ✅ Each class focused on one domain
// ✅ Easy to find where logic lives
// ✅ Easy to test
// ✅ Easy to understand purpose
```

**Module Organization:**
```
src/
├── analysis/
│   ├── TypeDetector.ts
│   ├── SchemaInferencer.ts
│   └── ValidationAnalyzer.ts
├── resolution/
│   ├── RelationshipResolver.ts
│   └── DependencyResolver.ts
├── optimization/
│   ├── ASTOptimizer.ts
│   └── TreeShaker.ts
├── emission/
│   ├── CodeFormatter.ts
│   ├── TypeScriptEmitter.ts
│   └── HooksEmitter.ts
└── linking/
    └── ResourceLinker.ts

// ✅ Clear organization
// ✅ Related classes grouped
// ✅ Easy to navigate
```

**Checklist:**
- [ ] No utils.ts file > 200 lines
- [ ] Each class has single responsibility
- [ ] Related classes in same module
- [ ] Utilities organized by domain, not alphabetically
- [ ] Easy to find where specific logic lives

---

## The 3 Critical Principles (Must Choose If Only 3)

Kalau harus memilih hanya 3 dari 10 principles untuk RouteSync:

### 1. Single Source of Truth
**Why:** Semua masalah besar RouteSync berasal dari info yang duplicate di berbagai tempat.

### 2. Unidirectional Dependencies
**Why:** Circular dependencies make it impossible to parallelize, cache, atau incrementally build.

### 3. All Communication Via Artifact Registry
**Why:** Artifact registry adalah message bus yang enable caching, diffs, incremental builds, dan dependency tracking.

**Jika ketiga principle ini dijaga strictly, codebase bisa tumbuh ke ratusan ribu baris tanpa menjadi unmaintainable.**

---

## Implementation Checklist for RouteSync

### Phase 1: Foundation (Month 1)
- [ ] Implement CompilationState with ArtifactRegistry
- [ ] Define all core artifacts (not artifact classes yet)
- [ ] Implement PassManager for pass execution
- [ ] Implement artifact versioning/fingerprinting
- [ ] Set up TypedPass base class

### Phase 2: Refactor to Passes (Month 2)
- [ ] Extract existing logic into passes
- [ ] Ensure passes only read/write artifacts
- [ ] Remove direct pass-to-pass calls
- [ ] Implement pass dependency resolution
- [ ] Add pass execution visualization

### Phase 3: Remove Circular Dependencies (Month 3)
- [ ] Map current dependency graph
- [ ] Break circular dependencies
- [ ] Ensure unidirectional flow
- [ ] Add compile-time dependency checks
- [ ] Document expected data flow

### Phase 4: Immutability & Type Safety (Month 4)
- [ ] Make all artifacts readonly
- [ ] Remove all `any` types
- [ ] Add artifact builders for complex construction
- [ ] Enable strict TypeScript mode everywhere
- [ ] Add type environment for all types

### Phase 5: Layer Isolation (Month 5)
- [ ] Separate scanner layer from analysis layer
- [ ] Separate analysis layer from emitter layer
- [ ] Remove framework-specific code from core
- [ ] Create adapter pattern for frameworks
- [ ] Document extension points

### Phase 6: Testing & Validation (Month 6)
- [ ] Add architecture tests (dependency checks)
- [ ] Add artifact serialization tests
- [ ] Test incremental build scenarios
- [ ] Performance benchmark suite
- [ ] Regression test suite

---

## Monitoring & Enforcement

### Automated Checks
```typescript
// ArchitectureValidator.ts
class ArchitectureValidator {
  // Check no `any` in codebase
  validateNoImplicitAny()
  
  // Check dependency graph is acyclic
  validateAcyclicDependencies()
  
  // Check all artifacts immutable
  validateArtifactImmutability()
  
  // Check no direct pass calls
  validatePassIsolation()
  
  // Check SSOT principle
  validateSingleSourceOfTruth()
}
```

### CI/CD Integration
```yaml
# Every PR runs architectural validation
- Run: npm run validate:architecture
  - Check dependency graph
  - Check type safety
  - Check artifact immutability
  - Check pass isolation
  - Check SSOT violations
```

### Metrics to Track
- Number of `any` types (target: 0)
- Circular dependencies (target: 0)
- Average lines per utility file (target: < 200)
- Pass isolation violations (target: 0)
- Artifact mutation points (target: 0)

---

## Benefits of This Architecture

### Now (Medium-term)
- ✅ Parallel pass execution possible
- ✅ Incremental builds implementable
- ✅ Caching strategies trivial
- ✅ Easier testing and debugging
- ✅ Clear data flow visualization

### Future (Long-term)
- ✅ Can add GraphQL, OpenAPI without core changes
- ✅ Can add new languages without core changes
- ✅ Can distribute compilation across machines
- ✅ Can cache at artifact level
- ✅ Can detect affected routes on input change
- ✅ Can parallelize pass execution

---

## Key Difference from Current Architecture

### Current (Ad-hoc)
```
Input → Multiple detection phases → Multiple inference phases → Multiple emitters
  ↓            ↓                          ↓                        ↓
Some passes call other passes, some re-analyze data, circular dependencies exist
Type information sometimes lost, artifact information duplicated
```

### Proposed (Compiler-grade)
```
Input → Scanner Pass → Analysis Pass → Optimization Pass → Emitter Pass → Output
  ↓                                                             ↓
All communication via ArtifactRegistry
SSOT principle enforced
Unidirectional data flow
Parallelizable execution
Incrementally updateable
```

---

## References

This architecture is inspired by:
- **LLVM Compiler Infrastructure**: Pass architecture, IR representation
- **Roslyn (.NET Compiler)**: Symbol table, semantic analysis layer
- **Rust Compiler (rustc)**: Artifact-based compilation, type environment
- **TypeScript Compiler (tsc)**: Program/SourceFile/Module hierarchy

---

## FAQ

**Q: Ini berarti refactor total RouteSync?**
A: Tidak perlu total refactor. Bisa incremental. Start dengan CompilationState + PassManager, kemudian extract passes one by one.

**Q: Apakah ini lebih lambat?**
A: Tidak. Indirection melalui ArtifactRegistry negligible. Benefits (parallel execution, incremental builds, caching) akan lebih dari compensate.

**Q: Bagaimana dengan existing tests?**
A: Architecture tests baru, existing unit tests tetap valid. Migrate gradually.

**Q: Apakah ini overkill untuk projet ini?**
A: No. Ini investment untuk maintainability jangka panjang. Lebih baik atur sekarang daripada refactor nanti saat sudah 500K LOC.
