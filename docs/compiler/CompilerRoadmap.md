# RouteSync Compiler Infrastructure Roadmap

This document outlines the evolutionary roadmap of the RouteSync Compiler Platform, transforming it from a code generator into a peak-performance static analysis compiler framework.

```
v6.0 ──▶ v6.1 (Current) ──▶ v6.2 (Next) ──▶ v6.3 ──▶ v6.4 ──▶ v7.0 (IDE/LSP grade)
```

---

## v6.0 — Typed Pipeline & Core IR
* **Status**: Completed.
* **Core Deliverables**:
  * Unified `CompilationState` map with nominal types.
  * Topological Kahn's pass scheduler in `PassManager`.
  * Pointer-based OO intermediate representation (`ContractGraph`).
  * Emitter decoupling using visitor patterns (e.g. `TypeScriptEmitter`).

---

## v6.1 — Artifact Origin & Production Core
* **Status**: Completed.
* **Core Deliverables**:
  * **ArtifactOrigin**: Explicit classification (`source` | `pass` | `cache`) to validate inputs in `PassGraph`.
  * **CompilerFingerprint**: Deterministic option hashing to ensure robust, version-safe cache invalidation.
  * **Isomorphism-Invariant Hashing**: Fixed-point structural hashing using relative stack offsets (De Bruijn distance) in `TypeHasher`.
  * **Constraint Solver Diagnostics**: Collision checking for incompatible lattice bounds producing Contextual Diagnostics (`RS1023`).
  * **Semantic IR Ownership**: Explicit ownership metadata (`ownerModule`, `symbolId`, `dependencyEdges`) attached to `SemanticIRNode`.

---

## v6.2 — Parallel Execution & Query Memoization
* **Status**: Planned (Next Phase).
* **Core Deliverables**:
  * **Parallel Pass Scheduler**: Concurrent execution of independent passes using `PassCapability` and `executionMode`.
  * **Salsa-style Query Database**: Memoized query graph with dynamic dependency tracking (`MemoizedQueryDatabase`).
  * **Stable Symbol Identity**: Deterministic, non-volatile hashes based on namespace, qualified name, and source span instead of auto-incrementing integers.
  * **Full Arena Allocation**: Allocation of AST, BoundAST, and Constraint nodes in unified arenas using numeric reference ids.

---

## v6.3 — Control Flow & Static Single Assignment (SSA)
* **Status**: Planned.
* **Core Deliverables**:
  * **Control Flow Graph (CFG)**: Flow edge representation mapping conditionals, matches, loop constructs, and exceptions.
  * **SSA IR**: Transition of semantic representation into static single assignment form to support dataflow analysis.
  * **Data Flow Analysis**: Escape analysis, nullability inference, reaching definitions, and variable liveness tracking.

---

## v6.4 — Compiler Optimizations
* **Status**: Planned.
* **Core Deliverables**:
  * **Constant Propagation**: Inline folding of stable expressions and class constants.
  * **Dead Node Elimination**: Pruning of unused AST elements and unreferenced endpoint nodes.
  * **Generic Specialization**: Monomorphization of generic collection boundaries.

---

## v7.0 — IDE Integration & Persistent Servers
* **Status**: Planned.
* **Core Deliverables**:
  * **Persistent Incremental Database**: Background compilation daemon serving IDE diagnostics.
  * **LSP Integration**: Language Server Protocol implementation enabling hover, jump-to-definition, and refactoring fixes.
  * **Lazy Semantic Analysis**: On-demand type inference triggered by active editor focus spans.
