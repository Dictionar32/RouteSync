# Phase 1142 — Upstream Dataflow Input Producer Interface

## Boundary

The canonical semantic-dataflow lane is strengthened from:

`scanner knowledge -> semanticDataflowInputAdapter -> SemanticDataflowInput`

into:

`scanner evidence -> canonical identities/evidence -> SemanticDataflowInputProducerInterface -> SemanticDataflowInput -> semantic dataflow authority -> DataFlowInterface -> IR`

## Ownership

`types/upstream/semanticDataflowInputFactory.ts` now owns canonical construction of `SemanticDataflowInput` and fact lineage. The scanner adapter only translates scanner-local evidence into the already-defined upstream semantic vocabulary.

The generic `DataFlowInterface<Input, State, Node>` remains in `types/dataflow`. It is intentionally not imported by the upstream producer interface. This preserves the dependency direction: upstream owns domain meaning and seed contracts; downstream owns generic execution/state/query composition.

## Evidence boundary

The scanner-specific `value-flow` spelling is translated to the upstream `value_flow` ADT at the adapter boundary. The upstream factory never imports scanner types and never classifies PHP syntax.

## Result

- canonical input construction has one upstream producer implementation;
- producer lineage is attached at the upstream boundary;
- scanner adapter no longer owns role/entity catalogs or canonical fact construction;
- `DataFlowInterface` remains domain-neutral;
- graph remains structural and IR remains a projection;
- no `any` or assertion-based semantic widening is introduced by this phase.
