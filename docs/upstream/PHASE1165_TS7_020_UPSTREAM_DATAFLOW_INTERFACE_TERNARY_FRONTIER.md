# Phase 1165 — TS7.0.2 Upstream DataFlowInterface + Ternary Frontier

## Scope

Trace:

```text
examples/ecommerce-shop-source (Laravel)
        ↓
CompleteLaravelSourceModel
        ↓
SemanticDataflowInput
        ↓
semanticDataflowAuthority
        ↓
DataFlowInterface<Input, State, Node>
        ↓
analysis / IR projection
```

Structural graph remains a separate lane:

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

1. `DataFlowInterface<Input, State, Node>` is already the correct generic boundary.
2. `SemanticDataflowDataFlowAdapter` is wiring only: it exposes the closed upstream judgment and does not recalculate semantic closure downstream.
3. `SemanticDataflowIRProjection` consumes `dataflow.state.closure`; it remains a projection, not a second dataflow authority.
4. Manifest schema remains `6.0.0`; TypeScript compiler baseline is `7.0.2`. These are independent vocabularies.
5. TypeScript does not provide a compiler option that means `noTernary`. Therefore a RouteSync no-ternary invariant must be an AST-level audit, not a regex over `?` characters. Optional properties and conditional types must not be falsely classified as ternary expressions.

## Phase changes

### Upstream authority

`semanticDataflowAuthority.ts` now uses explicit discriminated branching for:

- `SemanticDataflowFact` key construction;
- optional guard key construction;
- guard accumulation.

Identity indexing continues to derive from `SemanticDataflowIdentityKey`; controller/action strings are not reconstructed as the identity source.

### IR

`SemanticDataflowIRProjection.ts` now uses explicit presence functions for:

- guard identity projection;
- lineage projection.

It continues to consume only `DataFlowInterface.state` and does not calculate reachability closure.

## Ternary policy

A source-level no-ternary policy must target the TypeScript AST node `ConditionalExpression`.

Do **not** use a repository-wide regex such as `?.*:` as the semantic gate because it conflates:

- conditional expressions (`condition ? a : b`),
- optional properties (`foo?: T`),
- optional parameters,
- conditional types (`T extends U ? X : Y`).

The current phase removes actual ternary usage from the canonical semantic-dataflow authority and IR projection touched by this phase. Other RouteSync source files still contain ternary syntax and remain a migration frontier; this phase does not falsely claim global zero-ternary compliance.

## External architectural confirmation

MLIR documents interfaces as generic interaction points that avoid embedding operation-specific knowledge in generic analyses, and its `DataFlowSolver` runs analyses to a fixed point before consumers query state. CodeQL likewise distinguishes AST nodes from semantic data-flow nodes and models data flow through a separate graph. These principles support keeping RouteSync's generic `DataFlowInterface` small while retaining Laravel/dataflow meaning upstream.

## Validation limitation

The extracted workspace does not contain local `node_modules/.bin/tsc` or `tsup`, so a genuine TypeScript 7.0.2 build cannot be claimed from this container. The workspace package manifests are pinned to `typescript: 7.0.2`. Local validation remains:

```bash
npm install
npx tsc --version
npm run build
```

Expected compiler version: `7.0.2`.
