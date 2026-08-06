# RouteSync: Panduan Arsitektur High-Level

## Filosofi Arsitektur

RouteSync dibangun dengan **modular architecture** yang memisahkan concerns dengan jelas: **Parse** (input processing), **Semantic** (type resolution), **IR** (intermediate representation), dan **Emit** (code generation). Setiap layer independen dan testable.

## System Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Laravel App   │────│  RouteSync CLI   │────│  Frontend App   │
│                 │    │                  │    │                 │
│ • routes/api.php│    │ • Scanner        │    │ • Generated SDK │
│ • Controllers   │────│ • Generator      │────│ • React Hooks   │
│ • Resources     │    │ • IR Builder     │    │ • Vue Composables│
│ • Models        │    │ • Emitters       │    │ • Type Definitions│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Core Architecture Components

### 1. Input Layer (Laravel Integration)
```
Laravel Application
├── routes/api.php          ← Route definitions
├── app/Http/Controllers/   ← Controller logic
├── app/Http/Resources/     ← API Resources
├── app/Http/Requests/      ← FormRequest validation
└── app/Models/            ← Eloquent models
```

**Responsibilities:**
- Expose route metadata via PHP reflection
- Provide model schemas via Laravel's Schema facade
- Supply validation rules from FormRequest classes

### 2. CLI Layer (Orchestration)
```
@routesync/cli
├── commands/
│   ├── scan.ts        ← Laravel scanning
│   ├── generate.ts    ← SDK generation
│   ├── watch.ts      ← Development mode
│   └── validate.ts    ← Manifest validation
├── scanners/
│   ├── RouteScanner.ts    ← Parse routes/api.php
│   ├── ModelScanner.ts    ← Extract DB schemas
│   └── ValidationScanner.ts ← Parse FormRequests
└── generators/
    ├── ContractGenerator.ts   ← Main orchestrator
    ├── layers/               ← Specific emitters
    └── __tests__/           ← Integration tests
```

**Responsibilities:**
- Orchestrate scanning and generation processes
- Provide CLI interface and user experience
- Handle file I/O and error reporting
- Coordinate between different packages

### 3. Core Layer (Foundation)
```
@routesync/core
├── types/
│   ├── route.ts      ← Route type definitions
│   ├── semantic.ts   ← Semantic analysis types
│   ├── ir.ts         ← Intermediate representation
│   └── emit.ts       ← Code generation types
├── semantic/
│   ├── SemanticResolutionKernel.ts ← Main resolver
│   ├── SymbolTable.ts             ← Type registry
│   ├── EloquentRegistry.ts        ← Model metadata
│   └── plugins/                   ← Resolution plugins
├── ir/
│   ├── ContractIRBuilder.ts    ← IR construction
│   ├── buildIRNode.ts         ← Node builders
│   └── ContractIRBuilderOptimized.ts ← Performance variant
└── utils/
    ├── type-guards.ts     ← Runtime type checking
    └── performance.ts     ← Performance monitoring
```

**Responsibilities:**
- Provide shared type definitions
- Implement semantic resolution logic
- Build intermediate representation
- Offer utility functions and base classes

### 4. Output Layer (Code Generation)
```
Generated Output Structure
├── api.ts              ← Main API client
├── types.ts            ← TypeScript interfaces  
├── hooks.ts            ← React Query hooks
├── actions.ts          ← Next.js Server Actions
├── schemas.ts          ← Zod validation schemas
└── core/
    └── models.ts       ← Raw Eloquent model types
```

## Data Flow Architecture

### 1. Scanning Phase
```
Laravel Routes → PHP Reflection → JSON Manifest
     ↓              ↓                ↓
 Controller    Route Metadata    Structured Data
 Analysis      Extraction        for Processing
```

**Process:**
1. **Route Discovery**: Parse `routes/api.php` untuk extract route definitions
2. **Controller Analysis**: Use PHP reflection untuk analyze controller methods
3. **Model Schema**: Query database untuk get table structures
4. **Validation Rules**: Parse FormRequest classes untuk extract rules
5. **Manifest Creation**: Serialize semua metadata ke JSON format

### 2. Generation Phase
```
JSON Manifest → Semantic Analysis → IR Building → Code Emission
     ↓              ↓                   ↓             ↓
 Route Data    Resolved Types     Contract IR    Generated Files
```

**Process:**
1. **Manifest Loading**: Parse JSON manifest ke internal structures
2. **Semantic Resolution**: Resolve types, relationships, dependencies
3. **IR Construction**: Build language-agnostic intermediate representation
4. **Code Emission**: Generate TypeScript, React, Vue, Zod code
5. **File Writing**: Write generated files ke output directory

## Semantic Resolution Architecture

### Type Resolution Pipeline
```
Raw Type Name → Symbol Lookup → Dependency Resolution → Resolved Type
     ↓              ↓                   ↓                  ↓
   "User"     ModelRegistry        Related Models      Full Type Info
```

**Components:**

#### 1. Symbol Table
```typescript
interface SymbolTable {
  models: Map<string, ModelInfo>
  resources: Map<string, ResourceInfo>
  controllers: Map<string, ControllerInfo>
  relationships: Map<string, RelationshipInfo[]>
}
```

#### 2. Semantic Resolution Kernel
```typescript
class SemanticResolutionKernel {
  // Main entry point
  async resolve(manifest: Manifest): Promise<ResolvedManifest>
  
  // Type resolution
  async resolveType(typeName: string): Promise<ResolvedType>
  
  // Relationship analysis
  async resolveRelationships(model: ModelInfo): Promise<Relationship[]>
  
  // Cross-reference resolution
  async resolveCrossReferences(): Promise<void>
}
```

#### 3. Resolution Plugins
```typescript
interface IResolutionPlugin {
  name: string
  priority: number
  canResolve(typeName: string): boolean
  resolve(typeName: string, context: ResolutionContext): Promise<ResolvedType>
}

// Built-in plugins
class EloquentModelPlugin implements IResolutionPlugin
class LaravelResourcePlugin implements IResolutionPlugin  
class ValidationRulePlugin implements IResolutionPlugin
class RelationshipPlugin implements IResolutionPlugin
```

## Intermediate Representation (IR) Architecture

### Contract IR Structure
```typescript
interface ContractIR {
  version: string
  metadata: GenerationMetadata
  contracts: ContractDefinition[]
  types: TypeDefinition[]
  dependencies: DependencyGraph
}

interface ContractDefinition {
  name: string
  path: string
  method: HttpMethod
  parameters: ParameterDefinition[]
  requestBody?: TypeReference
  responseBody: TypeReference
  validation?: ValidationSchema
  authentication: AuthConfig
}
```

### IR Building Process
```
Resolved Manifest → Contract Analysis → Dependency Graph → Optimized IR
       ↓                  ↓                ↓              ↓
   Type Info       API Contracts      Dependencies    Final IR
```

**Optimization Strategies:**
- **Type Deduplication**: Remove duplicate type definitions
- **Dependency Ordering**: Topologically sort dependencies
- **Dead Code Elimination**: Remove unused types and contracts
- **Inline Optimization**: Inline simple types untuk better performance

## Code Generation Architecture

### Emitter System
```typescript
interface IEmitter {
  name: string
  targetFormat: string
  emit(ir: ContractIR): Promise<GeneratedFile[]>
}

// Core emitters
class ApiEmitter implements IEmitter        // api.ts
class TypesEmitter implements IEmitter      // types.ts  
class HooksEmitter implements IEmitter      // hooks.ts
class ActionsEmitter implements IEmitter    // actions.ts
class SchemasEmitter implements IEmitter    // schemas.ts
```

### Template System
```typescript
interface TemplateEngine {
  compile(template: string): CompiledTemplate
  render(template: CompiledTemplate, data: any): string
  
  // Built-in helpers
  helpers: {
    camelCase(str: string): string
    pascalCase(str: string): string
    pluralize(str: string): string
    generateImports(types: TypeReference[]): string
  }
}
```

### Generation Pipeline
```
Contract IR → Template Selection → Data Preparation → Code Generation → Post-processing
     ↓              ↓                  ↓               ↓                ↓
  Contracts    Choose Templates    Transform Data   Generate Code   Optimize Output
```

## Package Architecture

### Dependency Graph
```
┌─────────────┐
│    @core    │ ← Foundation package (no dependencies)
└─────────────┘
       ↑
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    @cli     │  │    @sdk     │  │   @react    │
└─────────────┘  └─────────────┘  └─────────────┘
                        ↑                ↑
                ┌─────────────┐  ┌─────────────┐
                │    @vue     │  │   @other    │
                └─────────────┘  └─────────────┘
```

### Package Responsibilities

#### @routesync/core
- **Types & Interfaces**: Core type definitions
- **Semantic Engine**: Type resolution and analysis
- **IR System**: Intermediate representation building
- **Utilities**: Shared helper functions

#### @routesync/cli  
- **Command Interface**: CLI commands and arguments
- **Scanner System**: Laravel integration and parsing
- **Generator Orchestration**: Coordinate generation process
- **File Management**: Input/output operations

#### @routesync/sdk
- **Runtime Client**: HTTP client for generated APIs
- **Type Definitions**: Runtime type checking
- **Helper Functions**: Utilities for generated code
- **Framework Agnostic**: Core SDK functionality

#### @routesync/react
- **React Query Integration**: Hooks for data fetching
- **Form Integration**: React Hook Form + Zod
- **Type Safety**: Full TypeScript integration
- **Performance Optimization**: Caching and memoization

#### @routesync/vue
- **Vue Query Integration**: Composables for data fetching  
- **Form Integration**: VeeValidate + Zod
- **Reactivity**: Vue 3 Composition API
- **SSR Support**: Server-side rendering compatibility

## Performance Architecture

### Caching Strategy
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Memory Cache   │────│   File Cache    │────│ Database Cache  │
│                 │    │                 │    │                 │
│ • Type Results  │    │ • Manifest Data │    │ • Model Schemas │
│ • IR Objects    │    │ • Generated IR  │    │ • Table Columns │
│ • Templates     │    │ • Templates     │    │ • Relationships │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Optimization Techniques
- **Lazy Loading**: Load components on-demand
- **Streaming Processing**: Process large manifests in chunks
- **Parallel Execution**: Run independent operations concurrently
- **Memory Management**: Explicit cleanup and garbage collection
- **Template Compilation**: Pre-compile templates untuk better performance

## Scalability Architecture

### Horizontal Scaling
```
Large Manifest → Chunk Processing → Parallel Generation → Merge Results
      ↓               ↓                   ↓                ↓
   1000+ Routes    50 Route Chunks    Independent Workers   Final Output
```

### Vertical Scaling
```
Resource Optimization
├── Memory Pool Management
├── CPU-bound Task Optimization  
├── I/O Batching
└── Cache Hit Rate Optimization
```

## Security Architecture

### Input Validation
```typescript
interface SecurityLayer {
  validateManifest(manifest: unknown): Promise<Manifest>
  sanitizeOutput(code: string): string
  checkPermissions(operation: string): boolean
  auditGeneration(metadata: GenerationMetadata): void
}
```

### Code Generation Security
- **Output Sanitization**: Remove potentially dangerous code
- **Template Security**: Validate template inputs
- **File Path Validation**: Prevent directory traversal
- **Content Security**: Validate generated code syntax

## Extension Architecture

### Plugin System
```typescript
interface IRouteSync Plugin {
  name: string
  version: string
  
  // Lifecycle hooks
  onScanStart?(context: ScanContext): Promise<void>
  onScanEnd?(manifest: Manifest): Promise<Manifest>
  onGenerateStart?(ir: ContractIR): Promise<ContractIR>
  onGenerateEnd?(files: GeneratedFile[]): Promise<GeneratedFile[]>
  
  // Custom emitters
  emitters?: IEmitter[]
  
  // Custom resolvers
  resolvers?: IResolutionPlugin[]
}
```

### Configuration Architecture
```typescript
interface RouteSync Config {
  // Input configuration
  input: {
    routeFile: string
    modelsEnabled: boolean
    validationEnabled: boolean
  }
  
  // Processing configuration  
  processing: {
    enableCaching: boolean
    parallelProcessing: boolean
    optimizations: OptimizationConfig
  }
  
  // Output configuration
  output: {
    directory: string
    formats: OutputFormat[]
    typescript: TypeScriptConfig
  }
  
  // Plugin configuration
  plugins: PluginConfig[]
}
```

Arsitektur ini mendukung **extensibility**, **maintainability**, dan **performance** untuk scale dari small projects sampai enterprise applications dengan thousands of routes.