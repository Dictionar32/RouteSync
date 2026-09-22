# Phase 87.56 — ResponseData Semantic Closure

## Trace

`Laravel response binding`
→ `deriveActionResponseData`
→ `ResponseData`
→ `resourceRegistry / contract extraction`

The response contract already carried the authoritative response identity and shape.
`ResponseData` duplicated that meaning through `resourceName`, `collection`, and `wrapped`.
Those fields forced downstream code to read primitive flags and re-derive response semantics.

## Change

`ResponseData` now carries:

- `contract: ResponseContract` as the semantic source of truth.
- `fields` only as the legacy syntax-level field projection required by mapper lowering.

Removed duplicated semantic state:

- `resourceName`
- `collection`
- `wrapped`

Consumers now obtain response identity from `response.value.contract.name.value`.

## Invariant

No active consumer may read `ResponseData.resourceName`, `ResponseData.collection`, or
`ResponseData.wrapped`. Response shape is read from `ResponseContract.shape`.

## Scope

This phase does not remove every primitive from the whole compiler. PHP literals, emitted
source text, and parser syntax values legitimately use primitive values. The target is the
semantic carrier layer: meaning must be represented by closed domain ADTs rather than free
boolean/string flags.
