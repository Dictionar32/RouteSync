# Phase 1145 — DataFlowInterface TypeScript 6 strengthening

## Boundary decision

`DataFlowInterface<Input, State, Node>` remains in `types/dataflow` and remains
framework/domain neutral. It is the downstream execution/state/query contract.

The semantic meaning of `Input`, `State`, and `Node` is supplied by upstream
semantic ADTs and a downstream wiring adapter. Upstream never imports the
generic dataflow package.

## Capability algebra

The generic contract is now factored as:

- `DataFlowSourceInterface<Input, State>` — input to state seeding;
- `DataFlowStepInterface<State>` — state-preserving derivation step;
- `DataFlowFixpointInterface<State>` — fixed-point close operation;
- `DataFlowExecutionInterface<Input, State>` — execution aggregate;
- `DataFlowStateInterface<State>` — canonical current state;
- `DataFlowQueryInterface<State, Node>` — semantic-neutral query capability;
- `DataFlowInterface<Input, State, Node>` — complete downstream contract.

This does not add Laravel source/sink/barrier policy to the generic interface.
Those remain analysis configuration in `compiler/analysis/dataflow`.

## CFG naming repair

`ControlFlowDataFlowInterface` was a misleading second name for a concrete CFG
solver. The canonical name is now `ControlFlowSolverInterface`; the old names
remain compatibility aliases. This prevents callers from confusing the CFG
solver with the generic `types/dataflow/DataFlowInterface`.

## TypeScript 6

The workspace manifests and lockfile target TypeScript `^6.0.3`.
The current root `tsconfig.json` already uses explicit modern settings:
`moduleResolution: bundler`, `module: ESNext`, explicit `types`, and explicit
`strict`, so no deprecated Node/classic module-resolution migration is needed
for the active configuration.

TypeScript 6 makes explicit `types` especially important because its default is
now `[]`; this workspace already explicitly lists `node` and `vitest/globals`.

## Dataflow / graph / IR ownership

```text
CompleteLaravelSourceModel
  ├─ structural semantic relations -> GraphEdgeRelation -> ServiceGraph
  └─ semantic dataflow inputs -> semantic authority
                                  -> DataFlowInterface adapter
                                  -> analysis / IR
```

Graph structure is not a dataflow policy and IR does not reconstruct closure.
