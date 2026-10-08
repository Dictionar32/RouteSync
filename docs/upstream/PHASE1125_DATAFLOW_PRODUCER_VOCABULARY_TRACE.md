# Phase 1125 — Dataflow Producer Vocabulary Trace

Direction: `upstream => wiring => interface => downstream`

## Finding
`SemanticDataflowLineage` previously advertised `request | route | controller | model_relation | resource | schema`, while the canonical runtime dataflow seed surface emits request, route, controller, and resource lineage only. `model_relation` and `schema` are structural evidence/provenance domains, not runtime dataflow producers.

## Fix
`SemanticDataflowLineageProducer` is now closed to:
- `request`
- `route`
- `controller`
- `resource`

Structural model-relation and schema provenance remain upstream semantic evidence and are not falsely represented as runtime dataflow lineage.

## Conservation
```text
source evidence
  -> canonical upstream semantic facts
  -> semanticDataflowManifestSurface
  -> DataFlowInterface
  -> dataflow/IR downstream projection
```

No downstream solver was added. `seed()` remains the sole judgment construction boundary; `derive()` and `close()` remain identity operations over the closed state.

## Interface guidance
`DataFlowInterface<Input, State, Node>` remains domain-neutral. `InterfaceDependencyBoundary<Upstream, Downstream>` remains generic and directional, owned by the downstream projection boundary.

## Verified
- Phase 1125 producer vocabulary audit: PASS
- Phase 1118 upstream/wiring/interface/downstream: PASS
- Phase 1086 graph downstream surface closure: PASS
- Phase 1074 StaticLaravelScanner removal: PASS
- targeted TypeScript transpile of changed dataflow files: PASS
