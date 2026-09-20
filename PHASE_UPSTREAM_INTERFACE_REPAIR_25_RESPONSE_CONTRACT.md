# Phase 25 — Response Semantic Contract

## Scope
Upstream interface only. Downstream implementation/flow was intentionally not migrated.

## Trace finding
`ResponseShape` and `ResponsePayloadContract` were independent ADTs. A consumer had to inspect two separate discriminators to determine the semantic response shape, allowing invalid combinations such as collection + model or paginated + primitive without the interface expressing the correlation.

## Repair
Introduced `ResponseSemanticShape` so response cardinality and payload travel together. `ResponseSemanticContract` is now the high-level response boundary.

`ResponseSemanticNode` now exposes the correlated `contract` rather than separate `shape` and `payload` fields.

`RouteSemanticNode` no longer duplicates endpoint request/response bindings; `RouteEndpointContract` is the canonical endpoint boundary.

## Principle
Do not make downstream re-classify a response from multiple partially independent fields. The upstream contract must carry the semantic combination already resolved.

## Expected compile errors
Existing producers/consumers may fail because they still construct/read the old `shape`, `payload`, `request`, or `response` fields. These are migration signals and must not be fixed by weakening the upstream interface.
