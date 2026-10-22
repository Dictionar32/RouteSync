# Phase 2184 — DTO response projection field SSOT

## Trace finding

The Phase 2183 interface carried both `responseContract.fields` and a parallel field projection shape with separately declared `name`, `value`, and `nullability`. TypeScript could not enforce that those duplicated descriptions were equal. The contract therefore risked allowing the response contract and its provenance projection to drift apart.

## Interface-first correction

- `LaravelDtoResponseContractFieldProjection` now contains the canonical `ResponseContractField` as `field` plus the DTO property's `SourceSpan`.
- The field's name, value contract, nullability, and evidence are reused from the domain SSOT instead of being independently restated.
- The projection contract is version 2 and explicitly records this invariant.
- The runtime executor interface follows the same contract version but no runtime implementation or wiring is added.
- Type-level regression tests assert that the field projection reuses the exact domain field type.

## Deliberate boundaries

This is a contract refinement only. It does not yet prove that `TypeExpression` maps to `ResponseValueContract`, nor does it implement the mapping, integrate the projection judgment, modify invocation semantic ownership, or remove the legacy descriptor path. Those remain subsequent work after the mapping algebra's closed input/output cases are specified.

No relation/foundation layer, subscanner, duplicate integrated-response authority, or invocation authority is introduced.
