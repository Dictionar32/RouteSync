# Phase 1164 — TypeScript 7.0.2 / Upstream DataFlow Interface Strengthening

## Boundary

```text
Laravel / ecommerce source
  -> CompleteLaravelSourceModel
  -> SemanticDataflowInputProducer
  -> SemanticDataflowInput
  -> semanticDataflowAuthority
  -> DataFlowInterface<Input, State, Node>
  -> analysis
  -> IR
```

Structural graph remains a separate lane:

```text
CompleteLaravelSourceModel.relations
  -> StructuralSemanticRelation
  -> GraphEdgeRelation
  -> GraphEdgeRelationSink
  -> ServiceGraph
```

## Strengthening

The manifest dataflow analysis no longer converts the upstream `Sequence<SemanticDataflowInput>` into an array and then performs `.find()`. Canonical identity lookup is now performed directly over the relational sequence using `relationVariantFold`, preserving `SemanticDataflowIdentity` as the lookup vocabulary.

The controller projection already carries `dataflowNode: SemanticDataflowIdentity`; downstream does not reconstruct a controller/action slot string.

`DataFlowInterface<Input, State, Node>` remains unchanged. Domain-specific Laravel semantics remain upstream.

The concrete manifest version constructor now returns the upstream `ManifestVersion` contract directly rather than using an `as const` assertion. This keeps the semantic type authoritative at the construction boundary.

## External alignment

TypeScript 7.0 is the current native compiler release and is described by the TypeScript team as a native port with substantial full-build speedups. citeturn0search0

MLIR's interface model supports generic transformations and analyses without encoding knowledge of every concrete operation/dialect, which supports keeping RouteSync's generic `DataFlowInterface` domain-neutral. citeturn0search2

MLIR's `DataFlowSolver` owns analysis orchestration, state, dependencies, and fixed-point execution, supporting RouteSync's separation between generic runtime contract and upstream semantic authority. citeturn0search7

CodeQL distinguishes semantic data-flow graph nodes from AST nodes and models flow through graph edges; this supports keeping data-flow identity semantic rather than rebuilding it from syntax strings downstream. citeturn0search3turn0search1

## TypeScript baseline

Active package manifests are pinned to TypeScript `7.0.2` exactly. The manifest schema version remains RouteSync's own `6.0.0` semantic contract; it is not the TypeScript compiler version and must not be changed merely because the compiler moved to TS7.

## Validation

The extracted checkpoint has no local `node_modules/.bin/tsc` or `node_modules/.bin/tsup`, so no full TS7/DTS build is claimed here. Source-level ownership and boundary checks were performed.
