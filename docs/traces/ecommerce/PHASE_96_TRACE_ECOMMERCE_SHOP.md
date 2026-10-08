# Phase 96 — Response/Pagination Interface Repair

## Trace

The Phase 95 endpoint IR still encoded pagination as `PaginationIR | null` for four response variants. That makes absence a second semantic channel and forces downstream checks. The pagination metadata was also `string[]`, so the interface did not carry domain meaning.

## Repair

- Introduced `PaginationState = none | present`.
- `present` carries a closed `PaginationDescriptor` ADT.
- Pagination metadata now uses `ResponseMetaKey`, not naked strings.
- `ResponseReference` now always carries `PaginationState`.
- Existing endpoint construction emits the explicit `none` state instead of `null`.

## Dataflow

`Laravel AST → scanner boundary → verified response semantics → Endpoint IR → lowerer`

The endpoint IR no longer needs `null` to express pagination absence. No semantic fallback was added.

## ecommerce-shop consequence

For a response such as `RegisterResponse`, pagination is explicitly `none`; the response identity remains `RegisterResponse` and is not inferred from runtime `data = null`.

## Remaining next boundary

The next interface audit should remove response construction based on `controller + action + Resource` naming in `endpointRefs.ts` and consume the already-bound route response descriptor. That is the next upstream dataflow break.
