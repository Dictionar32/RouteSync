# RouteSync Phase 87.46 — High-Level Response Contract Boundary

## Goal
Move Laravel response meaning upstream so downstream stages do not use primitive/unknown values as the semantic model.

## Changes
- Added `types/domain/responseContracts.ts` as the high-level response contract ADT.
- `ResponseContractField` carries field identity + verified response meaning + nullability.
- `ResponseValueContract` is closed: `text`, `whole_number`, `decimal_number`, `boolean`, `empty`, `named`, `unresolved`.
- `mixed` no longer becomes the semantic value `unknown`; it becomes explicit `unresolved/mixed_declaration` at the boundary.
- `responseDtoReader` now parses the DTO once and produces both legacy compatibility fields and the high-level contract fields.
- `responseAttributeScanner` passes the high-level contract downstream.
- `ResponseSemanticContract` now stores `ResponseContractField[]` and explicit collection state.

## Dataflow
Laravel DTO AST -> ResponseDtoAnalysis -> ResponseContract -> Route/IR -> lowerers.

Concrete TypeScript/Zod primitive representation remains a downstream concern.

## Validation
`tsc --noEmit -p tsconfig.phase87.33.narrow.json` produced no diagnostics mentioning the changed response files. The repository still has pre-existing baseline diagnostics outside this change set.
