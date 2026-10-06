# Phase 1032 — Upstream Request Dataflow Projection

## Frontier

The ecommerce fixture has real Laravel `FormRequest` contracts and controller request bindings. The upstream `request.ts` contract already carries request fields, validation rules, validation lifecycle, and validated-input operations, but those facts were not entering the canonical semantic dataflow seed.

## Repair

- Added `request` as a fact-scoped `SemanticDataflowLineage.producer`.
- Added `semanticDataflowRequestProjection.ts`.
- Projected each bound `FormRequest` validation field as:
  - `request:<name>:raw:<field>` -> `request:<name>:validated:<field>`
  - `request:<name>:validated:<field>` -> controller request field binding.
- Wired request facts into the manifest seed surface.
- Added explicit request flow states: `raw_request`, `validated_request`, `controller_request`.
- Kept `DataFlowInterface` unchanged.
- Kept graph structural projection unchanged.
- Kept semantic dataflow IR as a consumer of `judgment.closure` unchanged.
- Added ecommerce policy coverage for request lineage and raw/validated/controller flow.

## Deliberate non-changes

Model relations and schema foreign keys remain structural evidence. They are not promoted automatically into value-flow facts. Graph construction does not own closure, and IR does not reconstruct or solve dataflow.

## External alignment

The boundary follows CodeQL's separation of source/sink/barrier/additional-step configuration from the flow engine and its state-aware configuration model. It also follows MLIR's separation between a fixed-point solver, analysis state, and downstream queries.
