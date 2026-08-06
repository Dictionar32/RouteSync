# Compiler Modules Reference

**Last Updated:** December 2024  
**Status:** Complete Refactoring  
**Original Source:** `packages/core/src/compiler.ts` (3245 lines) → 11 modular subsystems

This document provides a comprehensive reference for all modules in the refactored RouteSync compiler architecture.

---

## Overview

The compiler has been refactored from a monolithic 3245-line file into **11 domain-based subsystems** with **66 individual files**, organized for:
- **Separation of Concerns**: Each module has a single, well-defined responsibility
- **Testability**: Pure functions and clear interfaces enable comprehensive testing
- **Maintainability**: Small, focused files (50-200 lines each) are easier to understand
- **Extensibility**: Plugin architecture supports future enhancements

---

## Module Directory

### 1. [Utils Module](#utils-module) (`compiler/utils/`)
Core data structures and algorithms used throughout the compiler.

### 2. [Types Module](#types-module) (`compiler/types/`)
Semantic type system with support for complex type operations.

### 3. [Constraints Module](#constraints-module) (`compiler/constraints/`)
Type constraint solving and unification for type inference.

### 4. [IR Module](#ir-module) (`compiler/ir/`)
Intermediate representation structures for compilation pipeline.

### 5. [Artifacts Module](#artifacts-module) (`compiler/artifacts/`)
Typed compilation artifacts produced by compiler passes.

### 6. [Passes Module](#passes-module) (`compiler/passes/`)
Compiler pass orchestration and execution framework.

### 7. [Diagnostics Module](#diagnostics-module) (`compiler/diagnostics/`)
Error reporting and diagnostic collection system.

### 8. [Cache Module](#cache-module) (`compiler/cache/`)
Artifact caching for incremental compilation.

### 9. [Fingerprint Module](#fingerprint-module) (`compiler/fingerprint/`)
Content hashing for change detection.

### 10. [Result Module](#result-module) (`compiler/result/`)
Compilation result packaging with statistics.

### 11. [Analysis Module](#analysis-module) (`compiler/analysis/`)
Code analysis and static checking (future expansion).

---

## Utils Module

**Location:** `packages/core/src/compiler/utils/`  
**Purpose:** Foundational data structures and algorithms  
**Dependencies:** None (foundation layer)

### Files

#### `Queue.ts` - FIFO Queue Implementation
```typescript
export class FIFOQueue<T> {
  private items: T[] = []
  
  enqueue(item: T): void
  dequeue(): T | undefined
  peek(): T | undefined
  isEmpty(): boolean
  size(): number
}
```

**Use Cases:**
- Worklist algorithms in constraint solver
- BFS traversals in dependency graphs
- Task scheduling in pass manager

#### `Graph.ts` - Graph Data Structures and Algorithms
```typescript
// Immutable set implementation
export class FrozenSet<T> extends Set<T> {
  add(value: T): never
  delete(value: T): never
  clear(): never
}

// Dependency graph with cycle detection
export class DependencyGraph<T> {
  addNode(id: T): void
  addEdge(from: T, to: T): void
  topologicalSort(): T[]
  detectCycles(): T[][]
}

// Incremental dependency tracking
export class DependencyGraphBuilder<T> {
  addDependency(dependent: T, dependency: T): void
  getDependencies(node: T): Set<T>
  getDependents(node: T): Set<T>
}

// Strongly connected components (Tarjan's algorithm)
export class TarjanSCC<T> {
  findSCCs(graph: DependencyGraph<T>): T[][]
}

// Union-Find for equivalence classes
export class UnionFind<T> {
  union(a: T, b: T): void
  find(a: T): T
  connected(a: T, b: T): boolean
}
```

**Use Cases:**
- Pass dependency resolution
- Type constraint solving
- Artifact invalidation
- Circular dependency detection

#### `Hash.ts` - Content Hashing Functions
```typescript
/**
 * Compute stable identifier for a symbol
 * Used for artifact cache keys
 */
export function computeStableSymbolId(
  filePath: string,
  symbolName: string,
  symbolKind: SymbolKind
): string

/**
 * Compute hash of IR for change detection
 * Used for incremental compilation
 */
export function computeIRHash(ir: SemanticIR): string
```

**Use Cases:**
- Artifact cache key generation
- Incremental compilation change detection
- Symbol deduplication

---

## Types Module

**Location:** `packages/core/src/compiler/types/`  
**Purpose:** Semantic type system with structural and nominal typing  
**Dependencies:** Utils (ImmutableCollections)

### Architecture

The type system supports:
- **Structural Types**: Objects, collections, unions, intersections
- **Nominal Types**: References to named types
- **Generic Types**: Parameterized types with constraints
- **Type Operations**: Join, meet, subtyping, assignability
- **Type Interning**: Deduplication for memory efficiency
