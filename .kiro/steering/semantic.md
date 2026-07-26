# RouteSync: Panduan Sistem Tipe Semantik (IR v2)

**Versi:** Intermediate Representation v2  
**Status:** Spesifikasi Core untuk AI Agent  
**Sumber:** `packages/core/src/types/semantic.ts` (343 baris)

Dokumen ini memberikan panduan lengkap untuk AI agent yang bekerja dengan sistem tipe semantik RouteSync. Ini adalah lapisan fundamental yang mendefinisikan Intermediate Representation (IR) untuk seluruh pipeline compiler.

---

## 🎯 ARSITEKTUR IR v2 OVERVIEW

RouteSync menggunakan **3-Layer IR Architecture** yang memisahkan concerns secara bersih:

```
PHP Source Code (Laravel)
    ↓
RAW LAYER (IRRawNode) — Code mentah + hints ringan
    ↓
PARSED AST (ParsedASTNode) — Struktur sintaksis PHP → TypeScript
    ↓
SEMANTIC LAYER (SemanticNode) — Resolusi tipe final + context domain
```

### Prinsip Desain Core

1. **Immutable Layering**: Setiap layer bersifat immutable dan tidak mengubah layer sebelumnya
2. **Progressive Enhancement**: Raw → Parsed → Semantic (setiap layer menambah informasi)
3. **Traceability**: Setiap node dapat dilacak kembali ke source code asli
4. **Type Safety**: Strong typing di seluruh pipeline untuk mencegah runtime error
5. **Incremental Processing**: Setiap layer dapat di-cache dan di-invalidate secara independen

---

## 🏗️ KOMPONEN ARSITEKTUR UTAMA

### 1. Raw Layer — Input Immutable

**Tujuan:** Menyimpan kode PHP asli dengan minimal processing

```typescript
interface IRRawNode {
  kind: "raw_code";
  code: string;              // "$this->user->created_at"
  hints?: IRHints;           // Signal pattern tanpa processing berat
  parsed_ast?: ParsedASTNode; // Lazy parsing (optional)
}
```

**IRHints — Lightweight Pattern Recognition:**
```typescript
interface IRHints {
  pattern: "property_access" | "method_call" | "binary_expression" | ...;
  confidence?: number;        // 0..1 confidence score
  nullable?: boolean;         // Apakah hasil bisa null
  framework_context?: "eloquent" | "resource" | "blade";
}
```

**📋 Usage Pattern:**
```typescript
// ✅ BENAR: Raw node dengan hints minimal
const rawNode: IRRawNode = {
  kind: "raw_code",
  code: "$this->product->user->created_at",
  hints: {
    pattern: "property_access",
    confidence: 0.9,
    nullable: true,
    framework_context: "eloquent"
  }
};

// ❌ SALAH: Jangan lakukan heavy processing di Raw layer
const rawNode = {
  kind: "raw_code", 
  code: "$this->user->name",
  resolvedType: "string" // JANGAN! Ini tugas Semantic layer
};
```

### 2. Parsed AST — Struktur Sintaksis

**Tujuan:** Mengkonversi PHP syntax tree ke struktur yang TypeScript-friendly

**16 Tipe AST Node:**

| AST Node | Tujuan | Contoh PHP | Struktur |
|----------|--------|------------|----------|
| `PropertyAccessAST` | Akses property | `$user->name` | `{target, property}` |
| `MethodCallAST` | Pemanggilan method | `$user->getName()` | `{target, name, args}` |
| `BinaryExpressionAST` | Operasi binary | `$a + $b` | `{operator, left, right}` |
| `TernaryAST` | Conditional | `$x ? $a : $b` | `{condition, truthy, falsy}` |
| `TypeCastAST` | Type casting | `(string) $id` | `{castType, expression}` |
| `NullsafeChainAST` | Nullsafe access | `$user?->profile?->bio` | `{chain[]}` |
| `LiteralAST` | Literal values | `"hello"`, `123` | `{value}` |
| `VariableAST` | Variables | `$this`, `$user` | `{name}` |
| `ResourceAST` | Laravel Resource | `UserResource` | `{resource, collection}` |
| `ModelAST` | Eloquent Model | `User` | `{model}` |
| `StaticMethodCallAST` | Static calls | `User::find()` | `{target, name}` |
| `NewInstanceAST` | Object creation | `new UserResource()` | `{target, resource}` |
| `NullsafePropertyAccessAST` | Safe property | `$user?->name` | `{target, property}` |
| `PrimitiveAST` | Primitives | `string`, `int` | `{type}` |
| `UnknownAST` | Unparseable code | Complex expressions | `{code}` |

**📋 Contoh Parsing:**
```typescript
// PHP: "$this->user->created_at"
const ast: PropertyAccessAST = {
  kind: "property_access",
  target: {
    kind: "property_access",
    target: { kind: "variable", name: "$this" },
    property: "user"
  },
  property: "created_at"
};

// PHP: "$user->getName() ?? 'Anonymous'"
const ast: BinaryExpressionAST = {
  kind: "binary_expression",
  operator: "??",
  left: {
    kind: "method_call",
    target: { kind: "variable", name: "$user" },
    name: "getName",
    args: []
  },
  right: { kind: "literal", value: "Anonymous" }
};
```

### 3. Semantic Layer — Resolusi Tipe Final

**Tujuan:** Mengkonversi AST menjadi tipe domain yang dimengerti generator

**12 Tipe Semantik:**

| SemanticType | Deskripsi | Contoh Source | Generator Output |
|--------------|-----------|---------------|------------------|
| `"string"` | String primitif | `$user->name` | `z.string()` / `string` |
| `"number"` | Numeric | `$product->price` | `z.number()` / `number` |
| `"boolean"` | Boolean | `$user->is_active` | `z.boolean()` / `boolean` |
| `"datetime"` | Date/time | `$user->created_at` | `z.date()` / `Date` |
| `"array"` | Array | `$user->tags` | `z.array(...)` / `T[]` |
| `"object"` | Plain object | `$user->settings` | `z.record(...)` / `Record<>` |
| `"model"` | Eloquent model | `$post->user` | `UserSchema` / `User` |
| `"resource"` | API resource | `UserResource` | `UserResourceSchema` / `UserResource` |
| `"collection"` | Model collection | `$user->posts` | `z.array(PostSchema)` / `Post[]` |
| `"nullable"` | Nullable wrapper | `$user->bio ?? null` | `.nullable()` / `T \| null` |
| `"json-object"` | JSON field | `$user->metadata` | `z.record(z.unknown())` |
| `"unknown"` | Unresolved | Complex logic | `z.unknown()` / `unknown` |

**SemanticNode Structure:**
```typescript
interface SemanticNode extends SemanticResolution {
  type: SemanticType;        // Tipe akhir yang diresolve
  fields?: Record<string, any>; // Metadata tambahan (optional)
  
  // Dari SemanticResolution:
  status: "resolved" | "partial" | "failed";
  confidence: number;        // 0-100
  trace: TraceNode[];        // Evidence trail
}
```

---

## 🔧 SERVICE GRAPH INTELLIGENCE (IR v2 Extension)

### Execution Layer Analysis

RouteSync dapat menganalisis **4 lapisan eksekusi** dalam aplikasi Laravel:

```typescript
type ExecutionLayer = "controller" | "service" | "model" | "repository";
```

**Service Graph Components:**

1. **ServiceNode** - Service classes (`OrderService`, `PaymentService`)
2. **ControllerNode** - Controller actions (`OrderController@show`)
3. **ModelNode** - Eloquent models (`Order`, `User`)
4. **ServiceDependency** - Relationships antar komponen

**📋 Contoh Service Graph:**
```typescript
const serviceGraph: ServiceGraph = {
  services: {
    "OrderService": {
      kind: "service_node",
      name: "OrderService",
      methods: ["calculateTotal", "processPayment"],
      layer: "service",
      dependencies: [
        { from: "OrderService", to: "PaymentService", type: "calls", weight: 0.8 }
      ],
      confidence: 0.95
    }
  },
  controllers: {
    "OrderController": {
      kind: "controller_node", 
      name: "OrderController",
      routes: ["/orders/{id}"],
      actions: [{ name: "show" }],
      layer: "controller",
      calls: ["OrderService.calculateTotal"],
      confidence: 0.9
    }
  }
  // ... models, edges
};
```

### IRContext — Execution Context

```typescript
interface IRContext {
  modelMap: Record<string, any>;      // Available Eloquent models
  relationMap: Record<string, any>;   // Model relationships
  config?: { strictMode: boolean };
  
  // Execution layer context
  layer?: ExecutionLayer;
  controller?: ControllerNode;
  service?: ServiceNode;
  model?: ModelNode;
  
  // Graph traversal context
  graph?: {
    entrypoint?: boolean;    // Is this the entry point?
    visited?: string[];      // Avoid cycles
  };
}
```

---

## 🎨 ZOD AST — Type-Safe Schema Generation

**Tujuan:** Menghasilkan Zod schemas tanpa string concatenation

### 8 Zod AST Node Types

```typescript
type ZodAST = 
  | ZodObjectNode     // z.object({...})
  | ZodStringNode     // z.string()
  | ZodNumberNode     // z.number()
  | ZodBooleanNode    // z.boolean()
  | ZodArrayNode      // z.array(T)
  | ZodOptionalNode   // z.optional(T)
  | ZodUnionNode      // z.union([A, B, C])
  | ZodLiteralNode    // z.literal("value")
  | ZodUnknownNode;   // z.unknown()
```

**📋 Contoh Zod AST:**
```typescript
// Untuk: { name: string, age?: number, tags: string[] }
const zodAST: ZodObjectNode = {
  kind: "zod_object",
  shape: {
    name: { kind: "zod_string" },
    age: { 
      kind: "zod_optional", 
      inner: { kind: "zod_number" } 
    },
    tags: { 
      kind: "zod_array", 
      element: { kind: "zod_string" } 
    }
  }
};

// Render ke string:
// z.object({
//   name: z.string(),
//   age: z.number().optional(),
//   tags: z.array(z.string())
// })
```

**✅ Keuntungan Zod AST:**
- Type-safe construction
- Dapat di-transform dan di-optimize sebelum render
- Mendukung complex schemas (recursive, conditional)
- Tidak ada string concatenation bugs

---

## 🚨 POLA PENGGUNAAN KRITIS

### ✅ Implementasi yang Benar

**1. Progressive Layer Processing:**
```typescript
// BENAR: Process layer by layer
function processIRNode(raw: IRRawNode, context: IRContext): SemanticIRNode {
  // Step 1: Parse AST dari raw code
  const ast = parseToAST(raw.code, raw.hints);
  
  // Step 2: Resolve semantic dari AST + context
  const semantic = semanticKernel.resolve(ast, context);
  
  // Step 3: Combine semua informasi
  return {
    id: generateId(),
    source: context.source,
    node: raw,           // Raw layer tetap utuh
    semantic,            // Semantic layer hasil resolusi
    meta: generateMeta()
  };
}
```

**2. Immutable Node Construction:**
```typescript
// BENAR: Immutable, tidak mengubah input
function enhanceSemanticNode(node: SemanticNode, newInfo: any): SemanticNode {
  return {
    ...node,                    // Copy existing properties
    fields: {
      ...node.fields,           // Copy existing fields
      ...newInfo               // Add new information
    }
  };
}
```

**3. Context-Aware Resolution:**
```typescript
// BENAR: Gunakan context untuk informed decisions
function resolvePropertyAccess(
  ast: PropertyAccessAST, 
  context: IRContext
): SemanticNode {
  const targetType = resolveTarget(ast.target, context);
  
  if (targetType.type === "model") {
    const modelName = targetType.fields?.modelName;
    const modelDef = context.modelMap[modelName];
    
    if (modelDef?.fields[ast.property]) {
      return createSemanticNode(
        modelDef.fields[ast.property].type,
        { confidence: 95, source: "model_definition" }
      );
    }
  }
  
  return createUnknownNode();
}
```

### ❌ Anti-Pattern yang Harus Dihindari

**1. Mutasi Layer:**
```typescript
// SALAH: Mengubah raw node setelah dibuat
function processNode(raw: IRRawNode) {
  raw.hints.confidence = 0.5;  // JANGAN! raw harus immutable
  raw.parsed_ast = parseAST();   // JANGAN! Gunakan return value
}
```

**2. String-Based Zod Generation:**
```typescript
// SALAH: String concatenation untuk Zod
function generateZodSchema(type: SemanticType): string {
  if (type === "string") return "z.string()";  // Fragile!
  if (type === "number") return "z.number()";  // Hard to compose!
}

// BENAR: Gunakan Zod AST
function generateZodAST(type: SemanticType): ZodAST {
  if (type === "string") return { kind: "zod_string" };
  if (type === "number") return { kind: "zod_number" };
}
```

**3. Context Ignorance:**
```typescript
// SALAH: Resolusi tanpa mempertimbangkan context
function resolveType(ast: ParsedASTNode): SemanticNode {
  if (ast.kind === "property_access") {
    return { type: "string" };  // Tebakan tanpa context!
  }
}

// BENAR: Context-aware resolution
function resolveType(ast: ParsedASTNode, context: IRContext): SemanticNode {
  // Gunakan modelMap, relationMap, execution layer info
}
```

---

## 🔍 DEBUGGING & TRACEABILITY

### Source Reference System

**SourceRef — Pelacakan Kembali ke Source:**
```typescript
interface SourceRef {
  file: string;           // Path file PHP
  line?: number;          // Nomor baris
  column?: number;        // Kolom
  context: "controller" | "resource" | "model" | "route" | "service";
}
```

**📋 Usage untuk Debugging:**
```typescript
// Trace error kembali ke source
function debugSemanticError(node: SemanticIRNode) {
  console.log(`Error in ${node.source.context}: ${node.source.file}:${node.source.line}`);
  console.log(`Raw code: ${node.node.code}`);
  console.log(`Semantic result: ${node.semantic.type}`);
  console.log(`Confidence: ${node.semantic.confidence}`);
  
  // Trace evidence trail
  node.semantic.trace.forEach(trace => {
    console.log(`  - ${trace.rule}: ${trace.evidence}`);
  });
}
```

### IRMeta — Incremental Build

```typescript
interface IRMeta {
  version: "ir.v2";        // IR version untuk compatibility
  stableHash: string;      // Content-based hash untuk caching
  lineage: string[];       // Dependency chain
  createdAt?: string;      // Timestamp creation
  tags?: string[];         // Classification tags
}
```

**📋 Caching & Invalidation:**
```typescript
// Cache berdasarkan stable hash
function getOrComputeSemantic(raw: IRRawNode, context: IRContext): SemanticNode {
  const cacheKey = computeStableHash(raw, context);
  
  let cached = semanticCache.get(cacheKey);
  if (cached && cached.meta.version === "ir.v2") {
    return cached;
  }
  
  const computed = computeSemantic(raw, context);
  semanticCache.set(cacheKey, computed);
  return computed;
}
```

---

## 🎯 INTEGRASI DENGAN PIPELINE ROUTESYNC

### Semantic Kernel v2 Contract

**Interface yang Harus Diimplementasi:**
```typescript
interface SemanticKernelV2 {
  resolve(node: ParsedASTNode, context: IRContext): SemanticNode;
}
```

**📋 Implementasi Reference:**
```typescript
class ProductionSemanticKernel implements SemanticKernelV2 {
  resolve(node: ParsedASTNode, context: IRContext): SemanticNode {
    switch (node.kind) {
      case "property_access":
        return this.resolvePropertyAccess(node, context);
      case "method_call": 
        return this.resolveMethodCall(node, context);
      case "literal":
        return this.resolveLiteral(node, context);
      // ... handle semua AST node types
      default:
        return this.createUnknownNode(`Unhandled AST: ${node.kind}`);
    }
  }
}
```

### Generator Integration Points

**Contract Generation:**
```typescript
class ZodContractGenerator {
  generateFromSemantic(semantic: SemanticNode): ZodContract {
    const ast = this.semanticToZodAST(semantic);
    return {
      ast,
      imports: this.computeRequiredImports(ast)
    };
  }
  
  private semanticToZodAST(semantic: SemanticNode): ZodAST {
    switch (semantic.type) {
      case "string": return { kind: "zod_string" };
      case "number": return { kind: "zod_number" };
      case "model": return this.generateModelZodAST(semantic);
      // ...
    }
  }
}
```

**SDK Module Generation:**
```typescript
class SDKModuleGenerator {
  generateFromIR(irNode: SemanticIRNode): GeneratedSDKModule {
    return {
      routeName: deriveRouteName(irNode.source),
      endpoint: extractEndpoint(irNode),
      method: extractHttpMethod(irNode),
      request: this.generateRequestContract(irNode),
      response: this.generateResponseContract(irNode.semantic),
      hooks: this.generateReactQueryHooks(irNode),
      zod: this.generateZodContract(irNode.semantic)
    };
  }
}
```

---

## 📋 EXTENSION GUIDELINES

### Menambah Tipe Semantic Baru

**1. Extend SemanticType Union:**
```typescript
export type SemanticType = 
  | "string" | "number" | "boolean"    // existing
  | "custom_type";                     // new type
```

**2. Update SemanticKernel Resolution:**
```typescript
class SemanticKernel implements SemanticKernelV2 {
  resolve(node: ParsedASTNode, context: IRContext): SemanticNode {
    // Add handling for new patterns that produce custom_type
    if (isCustomPattern(node, context)) {
      return {
        type: "custom_type",
        status: "resolved", 
        confidence: 90,
        trace: [/* evidence */]
      };
    }
  }
}
```

**3. Update All Generators:**
```typescript
// ZodTierGenerator
function semanticToZodAST(semantic: SemanticNode): ZodAST {
  switch (semantic.type) {
    case "custom_type": 
      return { kind: "zod_custom", schema: "..." };
  }
}

// TypeGenerator  
function semanticToTsType(semantic: SemanticNode): string {
  switch (semantic.type) {
    case "custom_type":
      return "CustomType";
  }
}
```

### Menambah AST Node Baru

**1. Define AST Interface:**
```typescript
export interface CustomAST {
  kind: "custom_expression";
  customField: string;
  nestedNodes: ParsedASTNode[];
}
```

**2. Update Union Type:**
```typescript
export type ParsedASTNode = 
  | PropertyAccessAST | MethodCallAST    // existing
  | CustomAST;                           // new
```

**3. Update Parser & Semantic Resolver:**
```typescript
// Parser
function parseToAST(code: string): ParsedASTNode {
  if (isCustomExpression(code)) {
    return { kind: "custom_expression", customField: "...", nestedNodes: [] };
  }
}

// Semantic resolver  
function resolve(node: ParsedASTNode, context: IRContext): SemanticNode {
  if (node.kind === "custom_expression") {
    return resolveCustomExpression(node, context);
  }
}
```

---

## 🚀 PERFORMANCE & OPTIMIZATION

### Caching Strategies

**Layer-Based Caching:**
```typescript
// Cache di setiap layer untuk efisiensi maksimal
class LayeredCache {
  private rawCache = new Map<string, IRRawNode>();
  private astCache = new Map<string, ParsedASTNode>();
  private semanticCache = new Map<string, SemanticNode>();
  
  getCachedSemantic(code: string, context: IRContext): SemanticNode | null {
    const key = `${code}:${hashContext(context)}`;
    return this.semanticCache.get(key) ?? null;
  }
}
```

**Incremental Invalidation:**
```typescript
// Invalidate cache berdasarkan dependency
function invalidateSemanticCache(changedModel: string) {
  const dependentKeys = semanticCache.keys().filter(key => 
    key.includes(changedModel)
  );
  dependentKeys.forEach(key => semanticCache.delete(key));
}
```

### Memory Management

**Lazy Loading AST:**
```typescript
interface IRRawNode {
  kind: "raw_code";
  code: string;
  hints?: IRHints;
  
  // Lazy-loaded, tidak selalu di-parse
  get parsed_ast(): ParsedASTNode | undefined {
    if (!this._parsed_ast && this.hints?.pattern !== "unknown") {
      this._parsed_ast = parseToAST(this.code, this.hints);
    }
    return this._parsed_ast;
  }
}
```

---

## 🎯 METRICS & SUCCESS INDICATORS

### IR Quality Metrics

| Metric | Baik | Warning | Kritis |
|--------|------|---------|--------|
| Semantic Confidence Avg | >85% | 70-85% | <70% |
| Unknown Node Ratio | <10% | 10-20% | >20% |
| Parse Success Rate | >95% | 90-95% | <90% |
| Cache Hit Ratio | >80% | 60-80% | <60% |
| Resolution Time per Node | <5ms | 5-15ms | >15ms |

### Code Quality Indicators

- **Type Coverage**: 100% semantic types handled in generators
- **AST Completeness**: Semua PHP patterns ter-cover oleh AST nodes
- **Context Utilization**: IRContext digunakan untuk semua resolusi
- **Immutability**: Zero mutations pada IR nodes setelah creation
- **Traceability**: 100% semantic decisions punya evidence trail

---

## 🔗 KOMPONEN TERKAIT

### Dependencies (Upstream)
- `packages/cli/src/parsers/` - PHP AST parsing dari Laravel source
- `packages/cli/src/resolvers/` - SemanticKernel implementations

### Consumers (Downstream)  
- `packages/cli/src/generators/` - Code generation dari SemanticIRNode
- `packages/cli/src/generators/layers/` - Layer-based generators
- `packages/react/` - React-specific type generation
- `packages/vue/` - Vue-specific type generation

### Configuration Files
- `packages/core/tsconfig.json` - TypeScript compiler settings
- `vitest.config.ts` - Test configuration untuk semantic tests

---

**Sistem tipe semantik ini adalah jantung dari RouteSync's type-safe compilation. Memahami struktur IR v2 ini essential untuk menjaga correctness dan performance seluruh pipeline.**

**Last Updated:** Juli 26, 2026  
**IR Version:** v2  
**Status:** Production dengan active development