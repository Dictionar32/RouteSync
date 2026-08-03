# Compiler Intermediate Representation (IR)

**Status**: Core Infrastructure  
**Layer**: Compiler IR Layer  
**Immutability**: All IR structures are immutable by design

## Apa itu IR?

**Intermediate Representation (IR)** adalah representasi program dalam bentuk yang lebih mudah diproses oleh compiler dibanding source code mentah, tapi lebih tinggi level daripada target code output.

```
Source Code (PHP)  →  IR (Data Structures)  →  Target Code (TypeScript/Zod/etc)
     ↓                      ↓                          ↓
   Parser              Semantic Analysis            Emitters
```

## Filosofi IR Layer

### 1. Framework-Agnostic
IR tidak tahu tentang Laravel, React, atau TypeScript. IR adalah pure data representation yang bisa diproses untuk generate output apapun.

### 2. Immutable by Design
Semua IR structures adalah `readonly`. Tidak ada mutation setelah creation. Ini memungkinkan:
- **Caching**: Same input → same IR → reuse cache
- **Incremental builds**: Detect affected artifacts by hash
- **Parallelization**: No race conditions
- **Deterministic**: Same source → same IR

### 3. Single Source of Truth (SSOT)
Setiap informasi domain hanya ada di satu IR artifact. Tidak ada duplikasi analisis.

## File-file dalam IR Layer

### 1. ResponseArtifact.ts ⭐⭐⭐ (SSOT untuk Response Analysis)

**Purpose**: SSOT untuk HTTP response characteristics analysis.

**Kapan Digunakan**:
- Saat menganalisis response type dari Laravel controller
- Menentukan apakah response adalah collection/single/paginated
- Menyimpan confidence score dan reasons untuk debugging

**Example Usage**:
```typescript
import { ResponseArtifactBuilder } from './ResponseArtifact'

// Build artifact untuk single resource response
const artifact = new ResponseArtifactBuilder()
  .id('users.show.Response')
  .resource('UserResource', 'User', 'single', 0.95, 'Explicit return type')
  .status(200)
  .contentType('application/json')
  .build()

// Check if collection
if (artifact.body && 'shape' in artifact.body) {
  const isCollection = artifact.body.shape === 'collection' || artifact.body.shape === 'paginated'
}
```

**Key Structures**:
```typescript
// ResponseBody: Discriminated union
type ResponseBody =
  | ResourceBody   // Laravel Resource transformation
  | ModelBody      // Eloquent model mentah
  | ObjectBody     // Ad-hoc object structure
  | PrimitiveBody  // Scalar values

// Each body has shape
interface ResourceBody {
  type: 'resource'
  resource: string
  model?: string
  shape: 'single' | 'collection' | 'paginated'  // ← SSOT untuk collection detection
}
```

**Architecture Principle**: Ini adalah THE artifact yang generators harus baca untuk collection detection. No re-computing di generator layer.

---

### 2. Expression.ts (AST Representation)

**Purpose**: Representasi PHP expressions dan constant values dalam bentuk AST.

**Kapan Digunakan**:
- Parsing PHP return statements
- Extracting constant values dari code
- Analyzing method calls dan property access
- Type inference dari expressions

**Example Usage**:
```typescript
import { Expression, ConstantValue, ClassConstant } from './Expression'

// PHP: return new UserResource($user);
const expr: Expression = {
  kind: 'Call',
  callee: 'UserResource',
  arguments: [{ kind: 'Literal', value: symbolRef }]
}

// PHP: User::class
const classRef: ConstantValue = new ClassConstant('App\\Models', 'User')

// PHP: $user->name
const propertyAccess: Expression = {
  kind: 'PropertyAccess',
  target: { kind: 'Literal', value: symbolRef },
  property: 'name'
}
```

**Key Structures**:
```typescript
type Expression =
  | { kind: 'Literal'; value: ConstantValue }
  | { kind: 'Call'; callee: string; arguments: Expression[] }
  | { kind: 'PropertyAccess'; target: Expression; property: string }
  | { kind: 'MethodCall'; target: Expression; method: string; arguments: Expression[] }

type ConstantValue =
  | string | number | boolean | null
  | ArrayConstant
  | ClassConstant
  | EnumCase
  | SymbolReference
```

**Use Case dalam RouteSync**:
```php
// PHP Controller:
return UserResource::collection($users);

// Parsed menjadi Expression:
{
  kind: 'MethodCall',
  target: { kind: 'Literal', value: ClassConstant('UserResource') },
  method: 'collection',
  arguments: [...]
}

// Semantic analysis deteksi: method 'collection' → isCollection = true
```

---

### 3. ContractGraph.ts (Dependency Graph)

**Purpose**: Representasi graph dari dependencies antar API contracts (Models, Resources, Schemas).

**Kapan Digunakan**:
- Tracking dependencies antar types
- Validating circular dependencies
- Topological sorting untuk code generation order
- Incremental compilation (via version hashes)

**Example Usage**:
```typescript
import { ContractGraphBuilder, EntityNode, RelationNode } from './ContractGraph'

const builder = new ContractGraphBuilder()

// Add entity node (Model/Resource)
builder.addNode(new EntityNode(
  { layer: 'entity', name: 'User' },
  'User',
  versionHash,
  propertiesMap
))

// Add relation node
builder.addNode(new RelationNode(
  { layer: 'relation', name: 'User-Posts' },
  'User-Posts',
  versionHash,
  { layer: 'entity', name: 'User' },
  { layer: 'entity', name: 'Post' }
))

const graph = builder.build()

// Traverse graph dengan visitor pattern
graph.nodes.forEach((node, key) => {
  node.accept(myVisitor)
})
```

**Key Structures**:
```typescript
interface NodeId {
  layer: 'entity' | 'schema' | 'endpoint' | 'relation'
  name: string
}

type ContractNode =
  | EntityNode    // Domain entities (User, Product, etc)
  | SchemaNode    // Data schemas
  | RelationNode  // Relationships (hasMany, belongsTo, etc)

class ContractGraph {
  constructor(public readonly nodes: ImmutableMap<string, ContractNode>)
  node(id: NodeId): ContractNode | undefined
}
```

**Architecture Pattern**: Visitor Pattern untuk traversal tanpa memodifikasi node structure.

---

### 4. Instruction.ts (Low-Level IR)

**Purpose**: Low-level instruction representation untuk optimization passes (seperti LLVM IR).

**Kapan Digunakan**:
- Advanced compiler optimizations
- Control flow analysis
- Data flow analysis
- Dead code elimination

**Example Usage**:
```typescript
import { Instruction } from './Instruction'

// Ini adalah low-level compiler infrastructure
// Biasanya tidak digunakan langsung di generator layer
// Digunakan oleh optimization passes
```

**Note**: Ini adalah advanced compiler feature untuk future optimizations.

---

### 5. SemanticIR.ts (Semantic Analysis Results)

**Purpose**: Menyimpan hasil semantic analysis (type information, symbol resolution, etc).

**Kapan Digunakan**:
- Setelah type inference
- Menyimpan resolved symbols
- Menyimpan type constraints
- Origin tracking untuk error messages

**Example Usage**:
```typescript
import { SemanticIR, SemanticOrigin } from './SemanticIR'

const origin: SemanticOrigin = {
  file: 'app/Http/Controllers/UserController.php',
  span: { start: { line: 10, column: 5 }, end: { line: 10, column: 30 } },
  snippet: 'return new UserResource($user);'
}
```

---

## Architecture Flow

### Compiler Pipeline dengan IR:

```
1. PHP Source Code
   ↓
2. Parser → Expression.ts
   (Parse return statements, method calls, etc)
   ↓
3. Semantic Analysis → SemanticIR.ts
   (Type inference, symbol resolution)
   ↓
4. Response Analysis → ResponseArtifact.ts
   (Determine collection/single, confidence scoring)
   ↓
5. Dependency Analysis → ContractGraph.ts
   (Build type dependency graph)
   ↓
6. Optimization → Instruction.ts (optional)
   (Advanced optimizations)
   ↓
7. Code Generation → Emitters
   (Read from artifacts, generate TypeScript/Zod/etc)
```

### SSOT Principle dalam IR:

```
ResponseArtifact = SSOT untuk response characteristics
    ↓ (generators READ from this)
    ├─→ ZodTierGenerator (no re-computation)
    ├─→ SDKEmitter (no action name heuristics)
    └─→ HookGenerator (no manual detection)
```

## Best Practices

### ✅ DO:
```typescript
// 1. Read from ResponseArtifact untuk collection detection
const artifact = responseArtifactMap.get(routeId)
const isCollection = artifact?.body?.shape === 'collection'

// 2. Use builder pattern untuk complex artifacts
const artifact = new ResponseArtifactBuilder()
  .id('route.Response')
  .resource('UserResource', 'User', 'collection')
  .build()

// 3. Use type guards untuk discriminated unions
if (isResourceBody(artifact.body)) {
  console.log(artifact.body.resource)  // Type-safe
}

// 4. Check confidence scores untuk debugging
if (!isHighConfidence(artifact)) {
  console.warn(`Low confidence: ${artifact.confidence.reasons.join(', ')}`)
}
```

### ❌ DON'T:
```typescript
// 1. JANGAN mutate IR structures
artifact.body.shape = 'collection'  // ❌ Readonly!

// 2. JANGAN re-compute collection detection di generator
const isCollection = actionName === 'index'  // ❌ Use artifact!

// 3. JANGAN store generation decisions di IR
artifact.derivedTypeName = 'UserList'  // ❌ IR is pure analysis

// 4. JANGAN bypass artifact lookups
if (route.response?.collection) { ... }  // ❌ Use artifact as SSOT
```

## File Relationships

```
ResponseArtifact.ts
  ↑ (built from)
Expression.ts + SemanticIR.ts
  ↓ (consumed by)
Generators (ZodTierGenerator, SDKEmitter, HookGenerator)

ContractGraph.ts
  ↑ (built from)
ResponseArtifact.ts + Model/Resource metadata
  ↓ (consumed by)
Dependency resolution + Code generation ordering

Instruction.ts
  (Advanced optimization layer - future use)
```

## Integration dengan Passes

ResponseAnalysisPass menggunakan IR structures:

```typescript
class ResponseAnalysisPass implements CompilerPass {
  async run(inputs, context) {
    // 1. Read parsed routes (Expression.ts structures)
    // 2. Perform semantic analysis (SemanticIR.ts)
    // 3. Build ResponseArtifact (ResponseArtifact.ts)
    // 4. Return artifact map for downstream consumers
    
    return [responseArtifactMap]
  }
}
```

## Version History

- **v1.0**: Initial IR structures (Expression, SemanticIR)
- **v2.0**: Added ContractGraph untuk dependency tracking
- **v3.0**: Added ResponseArtifact sebagai SSOT untuk response analysis
- **v3.1**: SSOT consolidation - ResponseArtifact sekarang used by all generators

## Further Reading

- `../passes/ResponseAnalysisPass.ts` - How ResponseArtifact is created
- `../../cli/src/generators/response-analysis-helper.ts` - CLI integration
- `../../../.kiro/steering/large-codebase-architecture.md` - SSOT principles
- `SSOT_CONSOLIDATION_PLAN.md` - Implementation plan untuk SSOT

## Questions?

**Q: Kapan saya perlu membuat IR baru?**  
A: Hanya jika Anda menambahkan analisis baru yang perlu disimpan sebagai artifact. Contoh: ValidationArtifact untuk FormRequest rules.

**Q: Apakah IR perlu di-serialize?**  
A: Ya, untuk caching. Semua IR structures harus serializable ke JSON.

**Q: Bagaimana cara testing IR?**  
A: Unit test artifact builders, integration test full pipeline dari source → IR → output.

**Q: IR vs Manifest, apa bedanya?**  
A: Manifest = external input (JSON dari Laravel scan). IR = internal compiler representation setelah semantic analysis.
