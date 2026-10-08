# Phase 1124 — Dataflow Producer Lineage Conservation

## Finding

The canonical `SemanticDataflowLineage` producer catalog already distinguishes `route` and `controller`, but the scanner-local `createSemanticDataflowInput()` adapter hard-coded every converted fact to `producer: 'controller'`.

That made route dataflow semantically usable while corrupting provenance. The same adapter is used by both the controller and route producers, so the producer role must be an explicit wiring input.

## Repair

`createSemanticDataflowInput()` now requires:

```ts
producer: 'route' | 'controller'
```

The controller producer passes `controller`; the route compatibility analyzer passes `route`.

The canonical upstream lineage remains the authority:

```text
route/controller semantic evidence
  => scanner wiring adapter + explicit producer
  => SemanticDataflowInput / SemanticDataflowFactLineage
  => DataFlowInterface
  => closed judgment
  => IR projection
```

No new dataflow solver or Laravel-specific `DataFlowInterface` vocabulary was introduced.

## Boundary

`DataFlowInterface<Input, State, Node>` remains generic. `InterfaceDependencyBoundary<Upstream, Downstream>` remains generic and downstream-owned.

The correction is provenance wiring, not interface widening.

## Evidence

- `semanticDataflow.ts` retains the closed producer catalog: request, route, controller, model_relation, resource, schema.
- `semanticDataflowInputAdapter.ts` no longer hard-codes controller lineage.
- controller and route producers pass their producer identity explicitly.
- Phase 1122 semantic dataflow provenance audit remains PASS.
- Phase 1124 producer-lineage audit is PASS.
