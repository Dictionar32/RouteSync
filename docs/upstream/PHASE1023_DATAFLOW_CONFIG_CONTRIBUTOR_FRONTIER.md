# Phase 1023 — DataFlow config contributor frontier

Phase 1022 established fact-level provenance so route, controller, resource, model-relation, and schema evidence can be distinguished without changing semantic fact identity.

Phase 1023 adds a downstream analysis-policy composition contract:

- `DataFlowConfigContribution<Node>` contains optional source, sink, additional-flow-step, and barrier predicates.
- `DataFlowConfigContributorInterface<Node, Context>` contributes policy for one analysis context.
- `composeDataFlowConfigContributors` OR-composes independent contributions into a complete configuration.

The contributor layer deliberately lives in `compiler/analysis/dataflow`, not `types/upstream`. `DataFlowInterface` remains execution/closure authority and is not expanded with source/sink policy.

No route/controller/model-relation/resource/schema contributor is hard-coded here. Producer identity is evidence; an analysis must explicitly decide which facts from those producers are relevant as source, sink, barrier, or additional flow step. This avoids turning Laravel framework semantics into universal data-flow policy.

CodeQL's `DataFlow::ConfigSig` follows the same separation: analysis configuration selects sources, sinks, barriers, and additional flow steps, while the global data-flow module performs tracking. MLIR similarly separates child analyses and transfer functions from `DataFlowSolver`, which orchestrates fixed-point execution.
