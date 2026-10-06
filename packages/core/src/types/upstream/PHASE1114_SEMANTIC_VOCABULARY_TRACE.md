# Phase 1114 — Semantic Vocabulary / Upstream → Wiring → Interface → Downstream

## Decision

Semantic vocabulary must not depend on compiler representations. Phase 1114 moves the canonical `SemanticType` algebra into `types/domain/semanticType.ts` and the response-body vocabulary into `types/domain/responseBody.ts`. Compiler modules consume these through downstream facades.

The upstream lane remains free of compiler/CLI dependencies:

```text
source evidence
    ↓
types/upstream
    ↓
types/domain semantic vocabulary
    ↓
compiler/scanner/wiring
    ↓
InterfaceDependencyBoundary / DataFlowInterface
    ↓
compiler analysis / graph / IR
    ↓
CLI package surface
```

## Canonical ownership

- `types/upstream`: source evidence, manifest, route/controller/model-relation/resource/schema vocabulary, semantic relations, type vocabulary, semantic dataflow contracts.
- `types/domain/semanticType.ts`: semantic type algebra used by domain semantics; no compiler target/lowering dependency.
- `types/domain/responseBody.ts`: semantic response-body/schema vocabulary; no compiler/IR dependency.
- `compiler/scanner/wiring`: Laravel adapters and lowering/construction boundaries.
- `compiler/types/SemanticType.ts`: downstream compatibility facade only.
- `compiler/ir/response/responseBodies.ts`: downstream response-body facade only.
- `compiler/domain/common/ts-lowerer`: owns TypeScript formatting; semantic types no longer carry `formatProperty`.
- `types/dataflow/DataFlowInterface`: remains generic.
- `types/interfaces/InterfaceDependencyBoundary`: remains generic and downstream-owned.
- graph and IR remain projections.
- CLI commands consume `@routesync/core` package surface.

## Legacy closure

Production references to `StaticLaravelScanner` and `compiler/scanner/upstream` remain empty. The legacy scanner directory remains absent.

## Semantic trace fixtures

The ecommerce fixture continues to prove:

- route → controller evidence
- controller → model relation evidence
- resource → response evidence
- migration/schema evidence

The Phase 1114 audit checks these facts without making graph or IR the semantic authority.

## Invariants

```text
production types/upstream → compiler imports = 0
production types/domain   → compiler imports = 0
production StaticLaravelScanner refs = 0
production scanner/upstream refs = 0
```

## External architecture references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- MLIR Toy interface tutorial: https://mlir.llvm.org/docs/Tutorials/Toy/Ch-4/
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- Soufflé facts: https://souffle-lang.github.io/facts
- Tree-sitter: https://tree-sitter.github.io/tree-sitter/
