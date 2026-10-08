# Phase 1029 — Ecommerce Fact-Scoped Policy Consumption

Phase 1028 verified that analysis policy matches the exact producer lineage identity rather than treating every endpoint of a fact as the producer node. The next trace found a production-boundary gap: `analyzeRouteSyncManifestDataflowWithPolicy` existed, but no ecommerce integration test exercised that policy boundary against the physical Laravel fixture.

## Trace result

The ecommerce fixture contains distinct evidence domains:

- routes: request/route binding evidence;
- controllers: action/query/resource binding evidence;
- model relations: structural Eloquent relation evidence;
- resources: response transformation evidence;
- schema migrations: persistence/FK evidence.

Laravel documents API Resources as a transformation layer between Eloquent models and JSON responses, including relationship serialization. That supports keeping resource semantics distinct from Eloquent model relations and from generic dataflow execution.

## Phase 1029 proof

`ecommerceShopDataflowPolicyPhase1029.spec.ts` now exercises the production policy boundary with:

- `sourceProducers: ['route']`;
- `sinkProducers: ['resource']`;
- source/sink assertions scoped to fact lineage;
- `semanticDataflowFlowsUnderPolicy(...)` querying the already-closed judgment;
- assertions that the policy leaves additional-flow-step and barrier disabled by default;
- assertions that the canonical least-fixed-point judgment remains unchanged.

The test therefore proves the intended ownership direction:

```text
Laravel fixture
  -> canonical manifest seed facts
  -> SemanticDataflowInterface
  -> semantic fixed point
  -> explicit analysis policy
  -> source/sink query
```

Policy is not fed back into semantic closure.

## Upstream recommendation

Keep `DataFlowInterface` unchanged. It remains the execution contract:

```text
seed -> derive -> close -> reaches
```

Do not add `isSource`, `isSink`, `isBarrier`, or `isAdditionalFlowStep` to the upstream interface. CodeQL similarly separates its global data-flow solver from the configuration that declares sources, sinks, barriers, and additional flow steps. MLIR likewise separates `DataFlowSolver` fixed-point orchestration from child `DataFlowAnalysis` state and transfer behavior.

The next useful frontier is an analysis-owned flow-state algebra only if the ecommerce proof requires state-sensitive semantics. It should remain downstream of `SemanticDataflowInterface` and must not become part of the upstream execution contract.
