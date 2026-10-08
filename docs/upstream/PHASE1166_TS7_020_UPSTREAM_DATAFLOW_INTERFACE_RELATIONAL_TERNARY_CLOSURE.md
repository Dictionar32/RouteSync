# Phase 1166 — TS7.0.2 Upstream DataFlowInterface Relational + Ternary Closure

## Scope

Trace and strengthen:

```text
examples/ecommerce-shop-source (Laravel)
        ↓
Laravel route/controller/request/resource evidence
        ↓
CompleteLaravelSourceModel
        ↓
SemanticDataflowInputProducerInterface
        ↓
SemanticDataflowInput
        ↓
semanticDataflowAuthority
        ↓
DataFlowInterface<Input, State, Node>
        ↓
analysis
        ↓
SemanticDataflowIRProjection
```

The structural graph remains independent:

```text
CompleteLaravelSourceModel.relations
        ↓
StructuralSemanticRelation
        ↓
GraphEdgeRelation
        ↓
GraphEdgeRelationSink
        ↓
ServiceGraph
```

## Findings

### 1. Generic dataflow interface remains correct

`DataFlowInterface<Input, State, Node>` remains unchanged. It exposes only:

- source/seed
- derivation step
- fixed-point close
- current state
- reachability query
- generic kind marker

No Laravel, controller, route, manifest, or IR semantics were added.

This preserves the upstream → wiring interface → downstream dependency boundary.

### 2. Upstream semantic dataflow is the authority

`CompleteLaravelSourceModel` is still the source-model boundary for Laravel evidence. `SemanticDataflowInputProducerInterface` canonicalizes producer evidence before it reaches the generic dataflow interface.

Route, controller query, and request projections now avoid runtime ternary expressions in their canonical dataflow construction paths. Discriminated `switch`/explicit branching is used instead.

### 3. IR identity storage moved to relational storage

`SemanticDataflowIRProjection` still consumes only:

```text
DataFlowInterface.state.closure
```

It does not calculate closure or reachability.

The previous imperative `Map<string, SemanticDataflowIdentity>` accumulator was replaced with the canonical `RelationIndex`/`relationIndexAdd` storage from the relational foundation. The IR remains a projection, but identity collection now follows the same relational storage vocabulary used by semantic/scanner layers.

### 4. Ternary policy

The no-ternary policy applies to runtime `ConditionalExpression` syntax.

These are intentionally not treated as runtime ternaries:

- optional properties/parameters (`foo?: T`)
- optional fields in semantic ADTs
- conditional types (`T extends U ? X : Y`)
- nullish coalescing (`??`)

A repository-wide zero-ternary gate should therefore inspect TypeScript AST `ConditionalExpression`, not grep for `?` characters.

### 5. TypeScript 7 / manifest distinction

Active RouteSync package manifests remain pinned to TypeScript `7.0.2`.

The RouteSync manifest schema remains `6.0.0`. The two version vocabularies are independent and must not be conflated.

## Laravel example trace

The example source contains real Laravel routes, controllers, requests, resources, models, and migrations under:

`examples/ecommerce-shop-source/`

The upstream manifest builder constructs `CompleteLaravelSourceModel` and projects its semantic dataflow seeds through `semanticDataflowInputsFromSourceModel`.

No graph/dataflow cross-dependency was found in `packages/core/src/graph`.

## External architecture confirmation

TypeScript 7.0 is the native compiler release and is intended to preserve TypeScript 6.0 type-checking behavior while changing implementation/performance characteristics.

MLIR recommends generic interfaces so analyses do not encode operation-specific knowledge. CodeQL likewise separates AST structure from semantic data-flow nodes and represents data flow in its own graph.

These principles support keeping RouteSync's `DataFlowInterface` generic while moving Laravel meaning upstream.

## Validation

The extracted workspace has no local `node_modules/.bin/tsc` or `node_modules/.bin/tsup`, so a full TS7 build is not claimed here.

Local validation:

```bash
npm install
npx tsc --version
npm run build
```

Expected compiler:

```text
Version 7.0.2
```
