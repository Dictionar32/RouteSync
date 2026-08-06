# RouteSync: Core Compiler Infrastructure Guide

**Version:** Compiler Infrastructure v2  
**Status:** Core Architecture Steering for AI Agents  
**Source:** `packages/core/src/compiler.ts` (3219 lines)

This document provides comprehensive guidance for AI agents working with RouteSync's core compiler infrastructure. This is the foundational layer that powers the entire compilation pipeline.

---

## 🎯 COMPILER ARCHITECTURE OVERVIEW

RouteSync's compiler follows a **multi-stage compilation pipeline** with formal compiler theory foundations:

```
Source Code (PHP/Laravel)
    ↓
AST Generation (Parsing)
    ↓
Semantic Analysis (Type Resolution)
    ↓
Intermediate Representation (IR)
    ↓
Optimization Passes
    ↓
Code Generation (TypeScript/React/Vue)
```

### Core Design Principles

1. **Artifact-Driven Compilation**: Everything is an immutable artifact with metadata
2. **Dependency-Aware Passes**: Each compiler pass declares inputs/outputs
3. **Incremental Compilation**: Caching and invalidation based on artifact hashes
4. **Type-Safe IR**: Strong typing throughout the compilation pipeline
5. **Formal Verification**: Built-in verification phases for correctness

---

## 🏗️ KEY ARCHITECTURAL COMPONENTS

### 1. Compilation Artifacts System

**Base Architecture:**
```typescript
abstract class CompilerArtifact {
  abstract readonly typeId: ArtifactKey;
  abstract readonly metadata: ArtifactMetadata;
}

interface ArtifactMetadata {
  readonly hash: string;           // Content-based hash for caching
  readonly producer: string;       // Which pass produced this
  readonly dependencies: string[]; // Input artifact hashes
  readonly timestamp: number;      // Generation time
  readonly revision: string;       // Compiler version
}
```

**12 Artifact Types (Complete Pipeline):**

| Artifact | Purpose | Produces | Consumes |
|----------|---------|----------|----------|
| `AST` | Parse tree from source | Raw syntax tree | Source files |
| `ScopeGraph` | Symbol scoping info | Symbol bindings by scope | AST |
| `BoundAST` | Semantic-aware AST | Type-resolved nodes | AST + ScopeGraph |
| `SymbolGraph` | Symbol table | Symbol definitions | BoundAST |
| `ConstraintGraph` | Type constraints | Type inference rules | SymbolGraph |
| `TypeEnvironment` | Resolved types | Type bindings | ConstraintGraph |
| `ExpressionIR` | Expression trees | Normalized expressions | TypeEnvironment |
| `LoweredTypeGraph` | Simplified types | Backend-ready types | ExpressionIR |
| `DiagnosticSnapshot` | Error/warning state | Compilation diagnostics | All stages |
| `DependencyGraph` | Module dependencies | Dependency topology | SymbolGraph |
| `SemanticIR` | High-level IR | Abstract operations | LoweredTypeGraph |
| `ContractGraph` | API contracts | Contract nodes/edges | SemanticIR |
| `CompilationResult` | Final output | Complete compilation | All artifacts |

### 2. Pass Management System

**Pass Definition:**
```typescript
interface CompilerPass<I extends readonly ArtifactKey[], O extends readonly ArtifactKey[]> {
  readonly name: string;
  readonly inputWitnesses: ArtifactKeyWitness<I>[];  // Type-safe inputs
  readonly outputKeys: O;                            // Type-safe outputs
  readonly descriptor: PassDescriptor;               // Dependency info
  run(inputs: ResolveArtifacts<I>): ResolveArtifacts<O>;
}
```

**Automatic Dependency Resolution:**
- `PassGraph.resolve()` computes topological order
- `PassGraph.resolveLayers()` enables parallel execution
- Detects cycles automatically (throws `CompilerPassCycle`)

**Example Pass Registration:**
```typescript
const manager = new PassManager(['AST']); // External inputs

// Type-safe pass registration
manager.registerPass({
  name: 'SemanticAnalysis',
  inputWitnesses: [ASTWitness, ScopeGraphWitness],
  outputKeys: ['BoundAST', 'ConstraintGraph'],
  run: async (inputs) => {
    const [ast, scopes] = inputs;
    // Process...
    return [boundAst, constraints];
  }
});
```

### 3. Type System Infrastructure

**Semantic Type Hierarchy:**
```typescript
type SemanticType =
  | PrimitiveType     // string, number, boolean, datetime, unknown
  | ReferenceType     // Namespace::ClassName references
  | UnionType         // A | B | C
  | IntersectionType  // A & B & C
  | ReadonlyCollectionType  // readonly T[]
  | MutableCollectionType   // T[]
  | GenericType       // Generic<T, U> with variance
  | ObjectType        // { prop: Type, ... }
  | NeverType         // Bottom type
  | ErrorType;        // Error during inference
```

**Type System Operations:**
- **Type Interning**: Canonical type instances (`TypeInterner`)
- **Subtype Checking**: Formal subtype relations (`TypeSystem.isSubtype()`)
- **Type Joining**: Least upper bound (`TypeSystem.join()`)
- **Type Meeting**: Greatest lower bound (`TypeSystem.meet()`)
- **Hash-Based Equality**: Content-based type comparison (`TypeHasher`)

**Constraint Solver:**
```typescript
// Type inference constraints
type Constraint =
  | { kind: 'PropertyExists'; source: TypeVariable; property: string }
  | { kind: 'Equality'; source: TypeVariable; target: TypeVariable }
  | { kind: 'Subtype'; source: TypeVariable; target: TypeVariable }
  | { kind: 'HasType'; source: TypeVariable; type: SemanticType };

// Solves constraints to produce TypeEnvironment
const solver = new ConstraintSolver();
const environment = solver.solve(constraints);
```

### 4. Contract Graph (Domain Model)

**Contract Node Types:**
```typescript
type ContractNode =
  | EntityNode     // Domain entities (User, Order, Product)
  | SchemaNode     // Data schemas (validation, serialization)
  | RelationNode;  // Entity relationships

class ContractGraph {
  readonly nodes: ImmutableMap<string, ContractNode>;
  
  node(id: NodeId): ContractNode | undefined;
}
```

**Visitor Pattern Implementation:**
```typescript
interface ContractVisitor<T> {
  visitEntity(node: EntityNode): T;
  visitSchema(node: SchemaNode): T;
  visitRelation(node: RelationNode): T;
}

// Usage in code generators
class TypeScriptEmitter implements ContractVisitor<GeneratedArtifact[]> {
  emit(graph: ContractGraph): GeneratedArtifact[] {
    return graph.nodes.flatMap(node => node.accept(this));
  }
}
```

---

## 🔧 ADVANCED COMPILER FEATURES

### 1. SSA (Static Single Assignment) Form

**SSA Construction Pipeline:**
1. **Phi Node Insertion** (`SSABuilder.insertPhiNodes()`)
2. **Variable Renaming** (`SSARenamer.rename()`)
3. **Verification** (`SSAVerifier.verify()`)

**SSA Instructions:**
```typescript
type Instruction =
  | { kind: 'Assign'; target: number; value: Operand }
  | { kind: 'Phi'; target: number; incoming: Map<number, Operand> }
  | { kind: 'Call'; target: string; args: Operand[] }
  | { kind: 'LoadProperty'; target: number; obj: Operand; property: string }
  | { kind: 'StoreProperty'; obj: Operand; property: string; value: Operand };
```

### 2. Control Flow Analysis

**Basic Block Structure:**
```typescript
interface BasicBlock {
  readonly id: number;
  readonly instructions: (Expression | Instruction)[];
  readonly successors: number[];    // Outgoing edges
  readonly predecessors: number[];  // Incoming edges
}

class ControlFlowGraph {
  readonly entryBlock: number;
  readonly exitBlock: number;
  readonly blocks: ReadonlyMap<number, BasicBlock>;
}
```

**Advanced Analysis:**
- **Dominance Analysis** (`DominatorTree`)
- **Loop Detection** (`LoopAnalysis`)
- **Data Flow Analysis** (`DataFlowAnalysis<T>`)

### 3. Optimization Infrastructure

**Built-in Optimizations:**
```typescript
// Dead code elimination
SSAOptimizer.eliminateDeadCode(instructions, useDefGraph);

// Constant folding
SSAOptimizer.foldConstants(instructions);

// Loop-invariant code motion
LICMOptimizer.hoistInvariants(cfg, loopBlocks, preHeaderId);

// Copy coalescing
CopyCoalescer.coalesce(instructions, useDefGraph);
```

**Optimization Pipeline:**
```typescript
// Fixed-point iteration until convergence
const optimized = OptimizationPipeline.runFixpoint(instructions, useDefGraph);
```

### 4. Salsa-Style Incremental Compilation

**Query-Based Compilation:**
```typescript
class SalsaCompiler {
  executeQuery<I, O>(
    key: QueryKey,
    compute: (input: I) => O,
    input: I,
    currentRevision: number
  ): O;
}

// Automatic dependency tracking and invalidation
const result = compiler.executeQuery(
  { queryName: 'typecheck', targetId: 'User::getName' },
  (input) => inferReturnType(input),
  context,
  revision
);
```

**Benefits:**
- Automatic incremental recompilation
- Cycle detection with detailed error traces
- Dependency-based cache invalidation

---

## 🚨 CRITICAL USAGE PATTERNS

### ✅ Correct Implementation Patterns

**1. Type-Safe Pass Creation:**
```typescript
// GOOD: Type-safe input/output declaration
const myPass: CompilerPass<['AST', 'SymbolGraph'], ['BoundAST']> = {
  name: 'SemanticBinding',
  inputWitnesses: [ASTWitness, SymbolGraphWitness],
  outputKeys: ['BoundAST'],
  run([ast, symbols]) {
    // TypeScript knows exact types of ast and symbols
    return [bindSymbols(ast, symbols)];
  }
};
```

**2. Immutable Artifact Creation:**
```typescript
// GOOD: Proper artifact construction with metadata
const artifact = new BoundASTArtifact(boundTree, {
  hash: computeContentHash(boundTree),
  producer: 'SemanticBinding',
  dependencies: [ast.metadata.hash, symbols.metadata.hash],
  timestamp: Date.now(),
  revision: COMPILER_VERSION
});
```

**3. Contract Graph Building:**
```typescript
// GOOD: Immutable graph construction
const builder = new ContractGraphBuilder();
builder
  .addNode(new EntityNode(id, 'User', hash, properties))
  .addNode(new SchemaNode(id, 'UserSchema', hash, schema));
const graph = builder.build(); // Immutable result
```

### ❌ Anti-Patterns to Avoid

**1. Mutable Artifact Modification:**
```typescript
// BAD: Mutating existing artifacts
artifact.metadata.hash = newHash; // Error! readonly property
artifact.root.children.push(newChild); // Error! readonly array
```

**2. Untyped Pass Implementation:**
```typescript
// BAD: Losing type safety
const pass = {
  run(inputs: any[]): any[] {  // Loses all type information
    return [processInput(inputs[0])];
  }
};
```

**3. Manual Dependency Management:**
```typescript
// BAD: Manual pass ordering instead of dependency declaration
await pass1.execute();
await pass2.execute(); // What if pass2 depends on pass1 output?
await pass3.execute();
```

---

## 🔍 DEBUGGING & VERIFICATION

### Built-in Verification System

**Verification Phases:**
- `PreOptimization`: Before any transformations
- `PostOptimization`: After all optimizations
- `Final`: Before code generation

**Verifier Types:**
```typescript
class CFGVerifier extends Verifier {
  phase = VerifierPhase.PreOptimization;
  
  verify(context: VerificationContext): void {
    // Validates control flow graph invariants
  }
}

class SSAVerifier extends Verifier {
  phase = VerifierPhase.PostOptimization;
  
  verify(context: VerificationContext): void {
    // Validates SSA form invariants
  }
}
```

### Diagnostic System

**Diagnostic Types:**
```typescript
interface Diagnostic {
  code: string;              // 'RS1023'
  severity: 'error' | 'warning';
  message: string;
  location?: FileSpan;       // Source location
  fix?: DiagnosticFix;       // Auto-fix suggestion
}
```

**Usage Pattern:**
```typescript
let diagnostics = DiagnosticBag.createEmpty();

if (typeError) {
  diagnostics = diagnostics.report({
    code: 'RS1023',
    severity: 'error',
    message: 'Type mismatch: expected string, got number',
    location: node.span
  });
}
```

### Debugging Tools

**Query Cycle Detection:**
```typescript
try {
  const result = compiler.executeQuery(key, compute, input, revision);
} catch (error) {
  if (error instanceof QueryCycleError) {
    console.log('Query cycle detected:');
    error.queryStack.forEach(frame => {
      console.log(`  ${frame.queryKind} -> ${frame.key.targetId}`);
    });
  }
}
```

**Artifact Dependency Tracing:**
```typescript
// Trace artifact dependencies for debugging
const dependencies = artifact.metadata.dependencies;
console.log(`Artifact produced by: ${artifact.metadata.producer}`);
console.log(`Input hashes: ${dependencies.join(', ')}`);
```

---

## 🎯 INTEGRATION WITH ROUTESYNC PIPELINE

### How Core Compiler Powers RouteSync

1. **Laravel AST Analysis** → `ASTArtifact`
2. **PHP Type Resolution** → `TypeEnvironment`
3. **API Contract Extraction** → `ContractGraph`
4. **Code Generation** → `CompilationResult`

### Generator Integration Points

**Contract Visitors for Code Generation:**
```typescript
class ZodEmitter implements ContractVisitor<string> {
  visitEntity(node: EntityNode): string {
    // Generate Zod schema from entity properties
    return `export const ${node.name}Schema = z.object({...})`;
  }
  
  visitSchema(node: SchemaNode): string {
    // Generate validation schema
    return generateZodFromSemanticType(node.schema);
  }
}
```

**Type-Safe Backend Configuration:**
```typescript
interface BackendCapability {
  supportsGenerics: boolean;    // TypeScript: true, PHP: false
  supportsNullable: boolean;    // TypeScript: true, C: false
  supportsReadonly: boolean;    // TypeScript: true, JavaScript: false
}

class ReactEmitter implements ContractEmitter {
  capability: BackendCapability = {
    supportsGenerics: true,
    supportsNullable: true,
    supportsReadonly: true
  };
}
```

---

## 📋 COMPILER EXTENSION GUIDELINES

### Adding New Artifact Types

1. **Define Artifact Class:**
```typescript
class CustomArtifact extends TypedArtifact<'Custom'> {
  public readonly typeId = 'Custom';
  constructor(
    public readonly data: CustomData,
    public readonly metadata: ArtifactMetadata
  ) { super(); }
}
```

2. **Update Registry:**
```typescript
interface ArtifactRegistry {
  // ... existing artifacts
  Custom: CustomArtifact;
}
```

3. **Create Witness:**
```typescript
const CustomWitness = new ArtifactKeyWitness('Custom');
```

### Adding New Compiler Passes

1. **Implement Pass Interface:**
```typescript
const customPass: CompilerPass<['Input1', 'Input2'], ['Output']> = {
  name: 'CustomTransformation',
  inputWitnesses: [Input1Witness, Input2Witness],
  outputKeys: ['Output'],
  descriptor: {
    consumes: ['Input1', 'Input2'],
    produces: ['Output']
  },
  async run([input1, input2]) {
    const result = transform(input1, input2);
    return [createOutputArtifact(result)];
  }
};
```

2. **Register with Manager:**
```typescript
manager.registerPass(customPass);
```

### Adding New Optimization Passes

1. **Implement Analysis:**
```typescript
const CustomAnalysis = new AnalysisKey<CustomAnalysisResult>('Custom');
```

2. **Create Optimization:**
```typescript
class CustomOptimizer {
  static optimize(
    instructions: readonly Instruction[],
    analysis: CustomAnalysisResult
  ): readonly Instruction[] {
    // Transform instructions
    return optimized;
  }
}
```

---

## 🚀 PERFORMANCE CONSIDERATIONS

### Compilation Performance

**Artifact Caching:**
- Content-based hashing prevents redundant computation
- Incremental invalidation via dependency tracking
- LRU cache for frequently accessed artifacts

**Parallel Pass Execution:**
- `PassGraph.resolveLayers()` identifies parallelizable passes
- Independent passes run concurrently
- Dependency barriers ensure correctness

**Memory Management:**
- Immutable data structures prevent accidental mutations
- Copy-on-write semantics for large collections
- Garbage collection of unused artifacts

### Optimization Guidelines

**Fast Paths:**
- Use `TypeInterner` for canonical type instances
- Implement `equals()` via hash comparison
- Cache computed properties in artifact metadata

**Bottleneck Identification:**
- Monitor pass execution times via `CompilationStatistics`
- Profile artifact creation/disposal
- Track cache hit/miss ratios

---

## 🎯 KEY SUCCESS METRICS

### Compiler Health Indicators

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cache Hit Ratio | >80% | 60-80% | <60% |
| Pass Cycle Detection | 0 cycles | <5 cycles | >5 cycles |
| Artifact Memory Usage | <100MB | 100-500MB | >500MB |
| Compilation Time | <5s | 5-15s | >15s |
| Verification Failures | 0 | 1-3 | >3 |

### Code Quality Indicators

- **Type Safety**: 100% of passes use typed witnesses
- **Immutability**: 0 mutable artifact modifications
- **Verification**: All critical invariants checked
- **Error Handling**: All compiler errors have diagnostic codes
- **Documentation**: All public APIs documented

---

## 🔗 RELATED COMPONENTS

### Upstream Dependencies
- `packages/cli/src/parsers/` - AST generation from Laravel source
- `packages/cli/src/resolvers/` - Semantic analysis and type inference

### Downstream Consumers
- `packages/cli/src/generators/` - Code generation from CompilationResult
- `packages/react/` - React-specific code generation
- `packages/vue/` - Vue-specific code generation

### Configuration Files
- `packages/core/tsconfig.json` - TypeScript compiler settings
- `vitest.config.ts` - Test runner configuration
- `tsup.config.ts` - Build system configuration

---

**This compiler infrastructure is the foundation of RouteSync's type-safe code generation. Understanding these patterns and constraints is essential for maintaining the system's correctness and performance guarantees.**

**Last Updated:** July 26, 2026  
**Compiler Version:** v6.1.0  
**Status:** Production-ready with active development