# Phase 1552 — Scanner Reasoning Ownership Map

## Current inventory

- Scanner TS/TSX files: **455**
- Production files: **362**
- Test files: **93**
- Files with reasoning signals: **182**
- Production files with direct generic solver calls: **0**

These are heuristic counts. Zero direct generic solver calls does not prove zero semantic reasoning: domain inference, candidate selection, precedence, type derivation, and fallback logic can exist without a generic solver call.

## Phase 1552 migration

Semantic object-type derivation moved from `compiler/scanner/subscanners/semantic/*` to `compiler/semantic/type-derivation/*`. Its upstream contract now defines the request, minimal interning capability, closed judgment, source coverage, and authority port. The runtime executor delegates to the authority. The scanner `SemanticTypeDeriver` remains a compatibility facade.

## Remaining frontiers

1. `RequestTypeDeriver` and `subscanners/request-deriver/*`: still contains derivation logic and should be migrated after its current contracts and consumers are traced.
2. `astClassifierRuntime.ts`: preserve AST parsing and node construction in scanner, but audit semantic/domain decisions mixed into parser classification.
3. Route security/CRUD resolver consumers: consume complete upstream judgments rather than reclassifying projections.
4. Controller expression/dataflow: complete the partial migration and audit all consumer paths.

## Reference design

MLIR recommends generic analysis and transformation depend on semantic interfaces rather than concrete implementation details: https://mlir.llvm.org/docs/Interfaces/. TypeScript architecture likewise separates parsing/AST construction from semantic checking and output generation: https://github.com/microsoft/TypeScript/wiki/Architectural-Overview.
