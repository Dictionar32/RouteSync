# Phase 1160 — TypeScript 7.0.2 / Upstream DataFlow Interface Trace

## Baseline

- TypeScript: 7.0.2 (exact, not a floating `^7.0.0` range)
- Target/lib: ES2025
- Module: ESNext
- Module resolution: Bundler
- Strict semantic boundary: enabled
- isolatedModules: enabled
- isolatedDeclarations: enabled

## Canonical flow

```text
Laravel source
  -> CompleteLaravelSourceModel
  -> SemanticDataflowEvidence
  -> SemanticDataflowInputProducer
  -> SemanticDataflowInput
  -> semanticDataflowAuthority
  -> DataFlowInterface<Input, State, Node>
  -> analysis / IR
```

Structural graph remains a separate lane:

```text
CompleteLaravelSourceModel.relations
  -> StructuralSemanticRelation
  -> GraphEdgeRelation
  -> ServiceGraph
```

## DataFlow boundary

`DataFlowInterface<Input, State, Node>` remains generic. Domain semantic meaning,
seed evidence, closure, and semantic identity remain upstream-owned. The downstream
adapter exposes the already-closed `SemanticDataflowJudgment` without reclassifying
or rebuilding its closure.

## Manifest

`ManifestDataflowSeedSurface` transports canonical `SemanticDataflowInput` values.
It does not assemble semantic closure and is not a second SSOT.

## IR

`SemanticDataflowIRProjection` reads `DataFlowInterface.state.closure` and projects
it. It does not derive a second closure.

## Strictness repair

The upstream completeness algebra previously used `as Extract<...>` to recover the
`cons` variant of `Sequence<T>`. This was replaced with direct discriminant narrowing
using `switch`, preserving the closed ADT without a semantic assertion.

`relationAt` remains owned by the membership algebra and is re-exported through the
relational sequence surface. It returns `RelationOption<T>`, providing an explicit
presence witness for indexed relation access under `noUncheckedIndexedAccess`.

## TypeScript lock note

Package manifests and the root lock metadata pin TypeScript 7.0.2. The environment
could not reach npm to regenerate the complete native optional-dependency lock graph,
so no fabricated optional-package integrity values were added. A normal `npm install`
with registry access should reconcile the complete lock graph.

## External architecture references

- TypeScript 7: native compiler, with official release documentation.
- MLIR interfaces/dataflow solver: generic interfaces and solver infrastructure should
  remain decoupled from dialect/domain-specific semantics.
- CodeQL dataflow: semantic data-flow nodes/edges are distinct from AST syntax and
  can be queried through a generic data-flow API.
