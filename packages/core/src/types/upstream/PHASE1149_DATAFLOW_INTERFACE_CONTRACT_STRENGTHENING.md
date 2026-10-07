# Phase 1149 — DataFlowInterface Contract Strengthening / Upstream Semantic Boundary

## Decision

The canonical data-flow architecture remains:

```text
Laravel / examples/ecommerce-shop-source
  -> scanner evidence
  -> CompleteLaravelSourceModel
  -> SemanticDataflowInputProducerInterface
  -> SemanticDataflowInput
  -> upstream semanticDataflowAuthority
  -> SemanticDataflowJudgment
  -> downstream DataFlowInterface<Input, State, Node>
  -> analysis / IR
```

The generic `DataFlowInterface` remains downstream-owned and domain-neutral. It is
now an actual TypeScript `interface`, rather than an intersection type alias, and
carries a structural contract marker:

```ts
interface DataFlowInterface<Input, State, Node>
  extends DataFlowExecutionInterface<Input, State>,
    DataFlowStateInterface<State>,
    DataFlowQueryInterface<State, Node> {
  readonly kind: 'data_flow_interface';
}
```

This strengthens accidental-shape rejection without introducing Laravel semantics
into the generic data-flow contract.

## Ownership

- `types/upstream/semanticDataflow.ts`: semantic identity, roles, facts, lineage,
  input and judgment ADTs.
- `types/upstream/semanticDataflowAuthority.ts`: sole semantic closure authority.
- `types/upstream/semanticDataflowInputFactory.ts`: canonical semantic input/seed
  construction and evidence boundary.
- `types/upstream/semanticDataflowKnowledge.ts`: canonical semantic knowledge/data-flow
  vocabulary; no scanner import.
- `types/upstream/semanticDataflowManifestSurface.ts`: transport-only manifest seed
  surface.
- `types/dataflow/dataFlowInterface.ts`: generic runtime execution/state/fixpoint/query
  contract only.
- `compiler/analysis/semanticDataflowDataFlowAdapter.ts`: downstream wiring from the
  closed upstream judgment into the generic contract.
- `compiler/ir/SemanticDataflowIRProjection.ts`: reads canonical `state.closure`; it
  does not derive closure.
- graph lane remains structural and does not consume `DataFlowInterface` as its graph
  construction authority.

## Example source trace

The physical Laravel example contains route/controller/request/resource/model
semantics. For example `routes/api.php` defines the `/produk` route family and
`ProdukController` uses `ProdukItem`, request values, eager-loaded `category` and
`frontend`, and `ProdukItemResource`. These are upstream evidence/semantic sources,
not data-flow solver implementation details.

The checked manifest contains 35 routes, 20 models, 4 resources, and no channels in
`routesync.manifest.fresh6.json`. The manifest transports the canonical `dataflowInputs`
surface; it does not become a second closure authority.

## TypeScript 6 posture

The workspace packages use TypeScript `^6.0.3` and strict checking. The root compiler
configuration keeps `target: ES2020` intentionally: TypeScript version and emitted
runtime target are separate concerns. TS6's stricter defaults make explicit type
contracts more valuable, but they do not justify moving domain semantics into the
runtime adapter.

## Verification

Focused strict checking of the strengthened data-flow boundary and its direct
consumers passes with no diagnostics. A wider source-level TypeScript check still
exposes unrelated existing TS6 migration errors in older domain/resource/model
surfaces; those are not caused by this phase.

## External architectural alignment

- MLIR's `DataFlowSolver` separates solver orchestration/fixpoint/state/dependency
  management from individual analyses.
- CodeQL models a semantic data-flow graph separately from the AST and exposes
  source/sink/step abstractions to a generic data-flow solver.
- MLIR interfaces are explicitly intended to let generic transformations interact
  with abstractions without embedding knowledge of every concrete dialect/operation.

These references support keeping RouteSync's generic data-flow interface small and
semantic-domain neutral while upstream owns the Laravel-derived meaning.
