# Phase 1158 — Upstream / Manifest / Graph / IR / DataFlow strict trace

## Canonical direction

```text
Laravel source
  -> CompleteLaravelSourceModel
  -> SemanticDataflowEvidence
  -> SemanticDataflowInputProducer
  -> SemanticDataflowInput
  -> semanticDataflowAuthority
  -> SemanticDataflowJudgment
  -> DataFlowInterface<Input, State, Node>
  -> analysis / IR
```

Structural relations remain a separate projection:

```text
Route / Controller / ModelRelation / Resource / Schema
  -> StructuralSemanticRelation
  -> GraphEdgeRelation
  -> GraphEdgeRelationSink
  -> ServiceGraph
```

## Interface rule

`DataFlowInterface<Input, State, Node>` remains generic. It exposes execution, canonical state,
fixed-point closure, and semantic reachability query. Laravel-specific meaning stays in upstream
semantic facts and judgments. Downstream must not reconstruct semantic closure.

## Strictness rule

TypeScript 7 is the compiler baseline. ES2025 remains the ECMAScript target. Strict checks include
`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`,
`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`, `isolatedModules`, and
`isolatedDeclarations`.

The relational foundation now exposes a proof-bearing `relationAt` option for indexed access.
Upstream semantic dataflow authority consumes that option instead of indexing facts directly.
This keeps `noUncheckedIndexedAccess` enabled without introducing casts.

## Evidence oracle

`examples/ecommerce-shop-source` remains the conservation oracle: Laravel routes/controllers/
requests/resources/models/schema evidence flows into the source model before manifest, graph,
dataflow, and IR projections. The manifest is not a second semantic source of truth.
