# Compiler Utilities

Directory ini berisi **utility foundational** yang digunakan di seluruh RouteSync compiler. Utility-utility ini menyediakan struktur data yang efisien, memory management, algoritma graph, dan source location tracking yang essential untuk performa dan kebenaran compiler.

## Filosofi

Utility di directory ini mengikuti **prinsip compiler-grade**:

1. **Performance First**: Dioptimasi untuk compiler workloads (AST besar, frequent lookups, graph traversals)
2. **Type Safety**: Strict TypeScript tanpa implicit `any` types
3. **Immutability**: Immutable collections mencegah accidental mutation bugs
4. **Memory Efficiency**: Arena allocators dan smart data structures meminimalkan GC pressure
5. **Zero Dependencies**: Pure TypeScript implementations untuk full control

---

## Core Utilities

### 1. Arena.ts - Memory Allocation & ID-Based Referencing

**Tujuan**: Menyediakan arena allocators untuk efficient memory management dan ID-based access patterns yang umum di compilers.

**Mengapa Pakai Arena Allocation:**
- **Performance**: Batch allocation mengurangi GC pressure
- **Locality**: Items disimpan secara contiguous di memory (cache performance lebih baik)
- **ID-Based References**: Pakai numeric IDs instead of pointers (serializable, comparable, hashable)
- **Bulk Deallocation**: Clear entire arena sekaligus instead of individual items

**Components:**

#### `Arena<T>` - Generic Arena Allocator
```typescript
const arena = new Arena<string>();
const id1 = arena.allocate("hello");  // Returns: 0
const id2 = arena.allocate("world");  // Returns: 1

console.log(arena.get(id1));  // "hello"
console.log(arena.size);      // 2
```

**Use Cases:**
- Store semantic types by ID
- Store validation artifacts
- Store response analysis results
- Data apapun dimana ID-based reference lebih efisien daripada direct pointers

#### `ASTArena` - Specialized AST Node Arena
```typescript
const arena = new ASTArena();

// Allocate child nodes
const identifierId = arena.allocateNode('Identifier', span1, []);
const typeId = arena.allocateNode('Type', span2, []);

// Allocate parent node referencing children
const propertyId = arena.allocateNode('PropertyDecl', span3, [identifierId, typeId]);

// Retrieve node data
const node = arena.getNode(propertyId);
console.log(node.kind);      // 'PropertyDecl'
console.log(node.children);  // [identifierId, typeId]
```

**Use Cases:**
- AST node storage selama parsing
- Reference child nodes by ID instead of nested objects
- Efficient tree traversal (children adalah IDs, bukan full objects)
- Serialization-friendly representation

**Performance Benefits:**
- **Memory**: O(n) space untuk n nodes vs. O(n²) untuk nested object references
- **Traversal**: O(1) node lookup by ID
- **Serialization**: IDs trivially serializable (cuma numbers)

---

### 2. Queue.ts - Efficient FIFO Queue

**Tujuan**: Menyediakan memory-efficient FIFO queue dengan smart compaction.

**Mengapa Tidak Pakai Array:**
- Standard array `shift()` adalah O(n) - requires copying all elements
- FIFOQueue `dequeue()` adalah O(1) amortized - uses head pointer
- Automatic compaction mencegah memory leaks di long-running processes

**Implementasi:**
```typescript
const queue = new FIFOQueue<string>();

queue.enqueue("a");
queue.enqueue("b");
queue.enqueue("c");

console.log(queue.dequeue());  // "a"
console.log(queue.dequeue());  // "b"
console.log(queue.length);     // 1
```

**Smart Compaction:**
- Tracks `head` pointer untuk avoid O(n) shift operations
- Compacts ketika `head > 1024` DAN `head * 2 >= length`
- Mencegah memory leaks selama BFS/graph traversal

**Use Cases:**
- BFS graph traversal (PassGraph, dependency analysis)
- Work queue untuk incremental compilation
- Event processing di watch mode
- Any breadth-first processing

**Performance:**
- **Enqueue**: O(1) - cuma push ke array
- **Dequeue**: O(1) amortized - head pointer increment
- **Compaction**: O(n) tapi jarang (hanya ketika head > 1024)

---

### 3. ImmutableCollections.ts - Immutable Wrappers

**Tujuan**: Menyediakan immutable wrappers around Map dan Set untuk mencegah accidental mutation.

**Mengapa Immutability Penting:**
- **Safety**: Compiler passes tidak boleh mutate shared data structures
- **Caching**: Immutable data bisa safely cached dan reused
- **Debugging**: Lebih mudah reasoning about data flow ketika state tidak berubah
- **Parallelization**: Safe untuk share across concurrent operations

**Components:**

#### `ImmutableMap<K, V>`
```typescript
const map = new ImmutableMap(new Map([
  ['User', { type: 'model', fields: [...] }],
  ['Product', { type: 'model', fields: [...] }]
]));

const user = map.get('User');  // Read-only access
// map.set('Post', {...})  // ❌ Compilation error: no set method
```

#### `ImmutableSet<T>`
```typescript
const set = new ImmutableSet(new Set(['GET', 'POST', 'PUT']));

console.log(set.has('GET'));  // true
// set.add('DELETE')  // ❌ Compilation error: no add method
```

**Use Cases:**
- Symbol tables yang tidak boleh berubah setelah construction
- Type environment snapshots
- Configuration yang harus tetap constant selama compilation
- Shared artifact registries

**Benefits:**
- **Type Safety**: Compile-time guarantee of immutability
- **Runtime Safety**: Bahkan dengan `as any` casts, underlying data di-copy
- **Clear Intent**: Reading vs. writing collections explicit di API

---

### 4. Graph.ts - Graph Data Structures & Algorithms

**Purpose**: Provides dependency graphs and graph algorithms for compiler dependency analysis.

**Components:**

#### `DependencyGraph` - Bidirectional Dependency Tracking
```typescript
interface DependencyGraph {
  forward: ReadonlyMap<string, ReadonlySet<string>>;   // A → [B, C]
  reverse: ReadonlyMap<string, ReadonlySet<string>>;   // B → [A]
}
```

**Use Cases:**
- Track which routes depend on which models
- Determine compilation order (topological sort)
- Incremental invalidation (find affected nodes)
- Circular dependency detection

#### `DependencyGraphBuilder` - Build Dependency Graphs
```typescript
const builder = new DependencyGraphBuilder();

builder.addDependency('usersIndex', 'User');  // usersIndex depends on User
builder.addDependency('usersShow', 'User');
builder.addDependency('User', 'Profile');      // User depends on Profile

const graph = builder.build();  // Immutable frozen graph
```

#### `IncrementalInvalidator` - Find Affected Nodes
```typescript
const invalidator = new IncrementalInvalidator(graph);

// If 'User' model changes, which routes are affected?
const affected = invalidator.invalidate('User');
console.log(affected);  // Set(['usersIndex', 'usersShow'])
```

**Use Cases:**
- Watch mode: Only regenerate affected routes when model changes
- Incremental compilation: Skip unchanged routes
- Cache invalidation: Know what to recompute

#### `TarjanSCC` - Strongly Connected Components
```typescript
const sccs = TarjanSCC.decompose(graph);
// Returns: [['User', 'Profile'], ['Product'], ['Order']]
//          ↑ circular dependency detected
```

**Use Cases:**
- Detect circular dependencies between types
- Topologically sort routes for generation order
- Validate dependency graph is acyclic

#### `UnionFind` - Disjoint Set Union
```typescript
const uf = new UnionFind();
uf.union(1, 2);  // Merge sets containing 1 and 2
uf.union(2, 3);  // Merge with set containing 3

console.log(uf.find(1) === uf.find(3));  // true (same set)
```

**Use Cases:**
- Group related types/routes into equivalence classes
- Connected component analysis
- Merge identical type definitions

**Performance:**
- **DependencyGraph**: O(1) lookup for dependencies
- **IncrementalInvalidator**: O(E) where E = number of affected edges
- **TarjanSCC**: O(V + E) where V = nodes, E = edges
- **UnionFind**: O(α(n)) amortized (inverse Ackermann, practically O(1))

---

### 5. Hash.ts - Stable Hashing

**Purpose**: Provides deterministic hashing for compiler artifacts.

**Why Stable Hashing:**
- **Caching**: Same input always produces same hash
- **Fingerprinting**: Detect when artifacts change
- **Incremental Builds**: Skip unchanged artifacts
- **Debugging**: Reproducible builds

**Functions:**

#### `computeStableSymbolId()` - Symbol Unique ID
```typescript
const symbolId = computeStableSymbolId(
  'App\\Models',           // namespace
  'User',                  // qualified name
  { filePath: 'User.php', start: 0, length: 100, line: 1, column: 0 }
);
// Returns: "a3f2b1c4d5e6f7a8" (16-char hex hash)
```

**Use Cases:**
- Generate stable IDs for Eloquent models
- Track symbols across compilation runs
- Cache key for semantic resolution results

#### `computeIRHash()` - IR Fingerprint
```typescript
const hash = computeIRHash(instructions);
// Returns: SHA-256 hash of instruction sequence
```

**Use Cases:**
- Detect when IR changes (cache invalidation)
- Incremental compilation (skip unchanged IR)
- Verify generated code matches expected output

**Implementation:**
- Uses Node.js `crypto.createHash('sha256')`
- Produces hex strings (human-readable)
- Deterministic across runs (no random salts)

---

### 6. SourceLocation.ts - Source Position Tracking

**Purpose**: Convert between offset-based and line/column-based source positions.

**Why This Matters:**
- **Parser**: Works with UTF-16 offsets (fast)
- **User**: Expects line/column numbers (human-readable)
- **LSP**: Requires line/column for hover tooltips, diagnostics
- **Performance**: O(log n) lookup via binary search

**Components:**

#### `LineMap` - Offset ↔ Line/Column Conversion
```typescript
const source = `class User {
  id: number;
  name: string;
}`;

const lineMap = new LineMap(source);

// Offset to line/column
const pos = lineMap.offsetToPosition(15);
console.log(pos);  // { line: 2, column: 2 } (1-indexed line, 0-indexed column)

// Line/column to offset
const offset = lineMap.positionToOffset(2, 2);
console.log(offset);  // 15
```

**Implementation:**
- Precomputes line start offsets during construction: O(n)
- Binary search for offset lookup: O(log n)
- Caches line map per file (amortized O(1))

**Important**: JavaScript uses UTF-16 encoding:
- `"hello".length === 5` ✅
- `"😀".length === 2` ⚠️ (emoji = 2 UTF-16 code units)
- Offsets count UTF-16 code units, not Unicode characters

#### Helper Functions

**`spanToRange()`** - FileSpan → SourceRange (for LSP)
```typescript
const span: FileSpan = { filePath: 'User.php', start: 10, length: 4, line: 2, column: 2 };
const range = spanToRange(span, lineMap);
// Returns: { file: 'User.php', startLine: 2, startChar: 2, endLine: 2, endChar: 6 }
```

**`createFileSpan()`** - Create FileSpan from offset
```typescript
const span = createFileSpan('User.php', 10, 4, lineMap);
// Automatically computes line/column from offset
```

**`spanContains()`** - Check if offset is within span
```typescript
const isInside = spanContains(span, 12);  // true
```

**`mergeSpans()`** - Merge adjacent spans
```typescript
const merged = mergeSpans(span1, span2);
// Returns: span covering both inputs
```

**Use Cases:**
- Error reporting with line/column numbers
- IDE hover tooltips
- Jump-to-definition navigation
- Syntax highlighting
- Source maps for generated code

---

## Usage Patterns

### Pattern 1: Arena-Based AST Construction
```typescript
// Selama parsing
const arena = new ASTArena();
const rootId = parseClass(arena, source);

// Selama semantic analysis
function analyzeClass(nodeId: ASTNodeId, arena: ASTArena) {
  const node = arena.getNode(nodeId);
  
  for (const childId of node.children) {
    analyzeClass(childId, arena);  // Recursive traversal by ID
  }
}

// Cleanup
arena.clear();  // O(1) bulk deallocation
```

### Pattern 2: Immutable Symbol Table
```typescript
// Build symbol table
const symbols = new Map<string, TypeInfo>();
symbols.set('User', { fields: [...] });
symbols.set('Product', { fields: [...] });

// Pass immutable view ke compiler passes
const immutableSymbols = new ImmutableMap(symbols);

// Pass hanya bisa read, tidak bisa modify
function analyzeRoute(route: Route, symbols: ImmutableMap<string, TypeInfo>) {
  const type = symbols.get(route.responseType);  // ✅ Read
  // symbols.set('NewType', {...})  // ❌ Compile error
}
```

### Pattern 3: Incremental Invalidation
```typescript
// Build dependency graph
const builder = new DependencyGraphBuilder();
builder.addDependency('usersIndex', 'User');
builder.addDependency('usersShow', 'User');
const graph = builder.build();

// Watch untuk changes
fs.watch('User.php', () => {
  const invalidator = new IncrementalInvalidator(graph);
  const affected = invalidator.invalidate('User');
  
  // Hanya regenerate affected routes
  for (const routeName of affected) {
    regenerateRoute(routeName);
  }
});
```

### Pattern 4: Error Reporting dengan Line Numbers
```typescript
const lineMap = new LineMap(sourceCode);

function reportError(span: FileSpan, message: string) {
  const range = spanToRange(span, lineMap);
  
  console.error(
    `${range.file}:${range.startLine}:${range.startChar} - ${message}`
  );
}
```

---

## Performance Characteristics

| Utility | Operation | Time Complexity | Space Complexity |
|---------|-----------|-----------------|------------------|
| Arena | allocate | O(1) | O(n) |
| Arena | get | O(1) | - |
| FIFOQueue | enqueue | O(1) | O(n) |
| FIFOQueue | dequeue | O(1) amortized | - |
| DependencyGraph | lookup | O(1) | O(V + E) |
| IncrementalInvalidator | invalidate | O(E) | O(V) |
| TarjanSCC | decompose | O(V + E) | O(V) |
| UnionFind | find/union | O(α(n)) ≈ O(1) | O(n) |
| LineMap | offsetToPosition | O(log n) | O(lines) |
| LineMap | positionToOffset | O(1) | - |

Where:
- n = number of items
- V = number of vertices (nodes)
- E = number of edges (dependencies)
- α(n) = inverse Ackermann function (practically constant)

---

## Design Decisions

### Mengapa Arena Allocation?
**Alternatif**: Direct object allocation dengan GC  
**Dipilih**: Arena allocator  
**Alasan**: 
- Compilers allocate jutaan AST nodes
- GC pressure adalah bottleneck signifikan
- Arena allocation 2-5x lebih cepat untuk compiler workloads
- Bulk deallocation adalah O(1) vs. O(n) untuk individual GC

### Mengapa Immutable Collections?
**Alternatif**: Mutable Map/Set dengan dokumentasi "don't modify"  
**Dipilih**: ImmutableMap/ImmutableSet wrappers  
**Alasan**:
- Type system enforce immutability (compile-time safety)
- Mencegah accidental mutation bugs (major source of compiler bugs)
- Enables safe caching dan parallelization
- Clear API: Reading vs. writing adalah explicit

### Mengapa FIFO Queue vs. Array?
**Alternatif**: Pakai array dengan `shift()`  
**Dipilih**: FIFOQueue dengan head pointer  
**Alasan**:
- Array `shift()` adalah O(n) - copies all elements
- FIFOQueue `dequeue()` adalah O(1) amortized
- BFS traversal performance critical untuk dependency analysis
- Smart compaction mencegah memory leaks

### Mengapa Binary Search untuk LineMap?
**Alternatif**: Cache line/column untuk setiap offset  
**Dipilih**: Binary search over line starts  
**Alasan**:
- O(n) space untuk n characters terlalu expensive
- O(lines) space untuk line starts acceptable
- O(log lines) lookup cukup cepat (lines typically < 10K)
- Most lookups hit same few lines (locality benefits)

---

## Integration dengan Compiler

### Bagaimana Utils Fit di Compiler Architecture

```
Compiler Pipeline
├── Scanner (pakai Arena untuk tokens)
├── Parser (pakai ASTArena untuk AST nodes)
├── Semantic Analysis (pakai ImmutableMap untuk symbols)
├── IR Builder (pakai DependencyGraph untuk dependencies)
├── Optimizer (pakai UnionFind untuk equivalence classes)
├── Emitter (pakai LineMap untuk source maps)
└── Writer (pakai Hash untuk fingerprinting)
```

### Shared State Patterns

**Artifact Registry Pattern:**
```typescript
class CompilationState {
  arena: Arena<Artifact>;              // ID-based artifact storage
  symbols: ImmutableMap<string, Type>; // Immutable symbol table
  dependencies: DependencyGraph;       // Dependency tracking
  lineMap: LineMap;                    // Source location mapping
}
```

**Pass Communication Pattern:**
```typescript
interface IPass {
  execute(state: CompilationState): void;
}

class SemanticPass implements IPass {
  execute(state: CompilationState) {
    // Read dari immutable structures
    const type = state.symbols.get('User');
    
    // Write ke arena
    const artifactId = state.arena.allocate({ type, metadata: {...} });
  }
}
```

---

## Testing Utilities

Each utility has corresponding test patterns:

### Arena Testing
```typescript
test('arena allocates sequential IDs', () => {
  const arena = new Arena<string>();
  expect(arena.allocate('a')).toBe(0);
  expect(arena.allocate('b')).toBe(1);
  expect(arena.get(0)).toBe('a');
});
```

### Graph Testing
```typescript
test('incremental invalidation finds affected nodes', () => {
  const builder = new DependencyGraphBuilder();
  builder.addDependency('A', 'B');
  builder.addDependency('B', 'C');
  const graph = builder.build();
  
  const invalidator = new IncrementalInvalidator(graph);
  const affected = invalidator.invalidate('C');
  
  expect(affected.has('B')).toBe(true);
  expect(affected.has('A')).toBe(true);
});
```

---

## Future Enhancements

### Potential Additions
1. **Memory Pool**: Pre-allocated memory for hot paths
2. **Persistent Data Structures**: Structural sharing for immutability
3. **Lock-Free Structures**: Thread-safe concurrent collections
4. **Custom Allocators**: Specialized allocators for specific types
5. **SIMD Optimizations**: Vectorized operations for bulk processing

### Monitoring
- Memory usage tracking per arena
- Cache hit rates for LineMap
- Queue compaction frequency
- Graph traversal performance

---

## Summary

Utility-utility ini adalah **foundation** dari RouteSync compiler. Mereka menyediakan:

✅ **Memory Efficiency**: Arena allocation meminimalkan GC pressure  
✅ **Performance**: O(1) operations untuk hot paths  
✅ **Type Safety**: Immutable collections mencegah mutation bugs  
✅ **Correctness**: Graph algorithms memastikan valid dependency ordering  
✅ **Debugging**: Source location tracking enable useful error messages  

**Golden Rule**: Semua compiler components harus pakai utility ini instead of ad-hoc implementations. Ini ensures consistency, performance, dan maintainability across the codebase.

---

## Ringkasan Utility

### Arena.ts
**Fungsi**: Memory allocation dengan ID-based referencing  
**Kapan Dipakai**: AST nodes, semantic types, artifacts yang butuh efficient storage  
**Performance**: O(1) allocate, O(1) get, O(1) bulk clear

### Queue.ts  
**Fungsi**: FIFO queue dengan smart compaction  
**Kapan Dipakai**: BFS traversal, work queues, event processing  
**Performance**: O(1) enqueue/dequeue amortized

### ImmutableCollections.ts
**Fungsi**: Immutable Map dan Set wrappers  
**Kapan Dipakai**: Symbol tables, type environments, shared registries  
**Benefit**: Compile-time guarantee no mutation

### Graph.ts
**Fungsi**: Dependency graphs dan graph algorithms  
**Kapan Dipakai**: Dependency tracking, incremental invalidation, circular detection  
**Algoritma**: DependencyGraph, IncrementalInvalidator, TarjanSCC, UnionFind

### Hash.ts
**Fungsi**: Deterministic hashing untuk artifacts  
**Kapan Dipakai**: Cache keys, fingerprinting, incremental builds  
**Output**: SHA-256 hex strings

### SourceLocation.ts
**Fungsi**: Offset ↔ line/column conversion  
**Kapan Dipakai**: Error reporting, LSP integration, debugging  
**Performance**: O(log n) binary search via LineMap
