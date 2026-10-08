# Phase 1056 — Upstream authority / wiring / downstream boundary repair

The canonical semantic dataflow authority remains upstream, but the generic
`DataFlowInterface` runtime adapter is now downstream composition code.

## Direction

`Route / Controller / Request / ModelRelation / Resource / Schema`
→ `Manifest / SemanticDataflowInput`
→ `createSemanticDataflowJudgment()` (upstream semantic authority)
→ `semanticDataflowDataFlowAdapter.ts` (wiring adapter)
→ `DataFlowInterface`
→ `analysis / policy / IR`.

Graph remains a separate structural lane:

`Route / Controller / ModelRelation / Resource / Schema`
→ `GraphSemanticRelation`
→ `GraphEdgeRelation`
→ `ServiceGraphBuilderInterface`
→ `ServiceGraph`.

## Boundary rules

- `DataFlowInterface` remains a small execution/state/query contract.
- `InterfaceDependencyBoundary<Upstream, Downstream>` remains directional and
  is used only where a downstream materialization/projection genuinely consumes
  an upstream value.
- `types/upstream/semanticDataflowAuthority.ts` owns semantic closure and no
  longer imports `DataFlowInterface`.
- `compiler/analysis/semanticDataflowDataFlowAdapter.ts` is the sole runtime
  adapter from the semantic authority to `DataFlowInterface`.
- The runtime composition boundary exposes only the generic interface.
- Upstream producers do not import `InterfaceDependencyBoundary`,
  `DataFlowProjectionInterface`, or the runtime boundary.
- IR consumes canonical closed dataflow state; it does not solve closure.
- Model relation and schema evidence remain structural/provenance evidence and
  do not imply value flow by themselves.
