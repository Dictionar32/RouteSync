# Phase 1115 — Canonical Type Vocabulary Boundary

## Direction

`upstream => wiring => interface => downstream`

## Ownership

- `types/upstream/typeVocabulary.ts` owns the closed source-facing type-expression vocabulary (`TypeExpression`, `TypeReference`, `TypeProperty`, `TypeParameter`, `DeclaredType`).
- `types/domain/semanticType.ts` owns resolved semantic type algebra (`SemanticType`, primitive/reference/union/intersection/collection/generic/object variants).
- `compiler/scanner/wiring` owns Laravel/source adapters and lowering from upstream semantic inputs into compiler materialization contracts.
- `types/dataflow/dataFlowInterface.ts` remains generic and does not encode Laravel concepts.
- `types/interfaces/interfaceDependencyBoundary.ts` remains a downstream-owned generic projection boundary.
- graph and IR consume canonical upstream/domain surfaces; they do not own semantic classification.
- `compiler/types/SemanticType.ts` remains only a compatibility facade for compiler consumers and is not imported by production `types/*` semantic vocabulary.

## Closure repaired in Phase 1115

The remaining production `types/ir/*` and `types/semantic/*` imports of `compiler/types/SemanticType` were replaced with direct imports from `types/domain/semanticType`.

The public `types/route.ts` barrel no longer re-exports the downstream compiler `RouteManifest` contract. Compiler-owned consumers now import the wiring contract directly.

`PrimitiveType` was restored to the compatibility facade because existing compiler consumers still legitimately use the facade while the canonical definition remains domain-owned.

## Trace

```text
Tree-sitter/source evidence
        |
        v
  types/upstream/typeVocabulary
        |
        v
  types/domain/semanticType
        |
        v
  scanner/wiring adapters + lowering
        |
        +--> DataFlowInterface / InterfaceDependencyBoundary
        |
        +--> graph projection
        |
        +--> IR projection
        |
        v
       CLI
```

## Evidence

Phase 1115 audit passes:

- upstream compiler imports: 0
- domain compiler imports: 0
- `types/semantic` imports of compiler `SemanticType`: 0
- `types/ir` imports of compiler `SemanticType`: 0
- `types/route.ts` compiler RouteManifest facade import: 0
- production `StaticLaravelScanner` / `scanner/upstream` references: 0
- ecommerce route/controller evidence: present
- ecommerce model relation evidence: present
- ecommerce resource evidence: present
- ecommerce schema evidence: present

The full repository does not provide a root `tsconfig.json` in this checkpoint, so repository-wide `tsc -p` cannot be run. A targeted TypeScript invocation was used; its remaining diagnostics are pre-existing baseline errors outside the Phase 1115 ownership edits, plus missing environment typings.
