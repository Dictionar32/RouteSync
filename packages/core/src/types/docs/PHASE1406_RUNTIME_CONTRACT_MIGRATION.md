# Phase 1406 — Runtime Contract Migration

Date: 2026-10-09

## Completed migration

- `CrudGroupExecutionContract` is now closed (`closed: true`) and required by `HookConfig`.
- React's `groupSlotResolver` no longer scans endpoint `$def.crudRole` or `$def.targetScope`; slot and custom endpoint resolution are direct projections of the contract.
- All 18 checked-in ecommerce example endpoint groups now declare an explicit `noCrudSlots` contract. Their hand-authored `api.ts` endpoint declarations contain no upstream Laravel route-capability manifest, so the example no longer pretends React can infer CRUD semantics from endpoint metadata.
- `ResourceGroupRouteReference` now carries `cacheOperationKey`, and the upstream resource-group algebra resolves `update`/`remove` normalization from the already-closed CRUD role.
- `ResourceGroupCapabilityContract.routes` publishes references for all routes. The CLI generator uses those upstream references and `cacheOperationKey` when projecting `actionKeys`; `toNormalizedActionKey` was removed from the generator API.
- The CLI-generated `crudSlots` object now includes `closed: true`.
- Updated Phase 1402 and Phase 1405 audits to check the current contract boundary rather than require the removed fallback. Added `audit:phase1406-runtime-contract-migration` and a JSON report.

## Validation

- Phase 1402 runtime CRUD contract audit: 12/12.
- Phase 1405 semantic ownership audit: 14/14 structural checks; related Phase 918 and Phase 729 / strict relational authority audits remain known failures.
- Phase 1406 runtime contract migration audit: 9/9.
- The JavaScript audit scripts pass `node --check`.
- Full TypeScript build remains unverified: this extracted workspace has no `node_modules`, `tsdown` is unavailable, and the global TypeScript 5.8.3 does not match the package's declared TypeScript 7 toolchain.

## Remaining migration work

1. Separate `sourceAstScanner.ts` source evidence/AST extraction from recursive semantic producer selection.
2. Move duplicate action-symbol resolution out of `routeGrouper.ts` and into an upstream closed identity contract, accounting for group aliases.
3. Trace and retire legacy role-based helpers in `resourceGroupDescriptors.ts` after all consumers use the upstream execution-slot ADT.
4. Verify every dataflow consumer consumes upstream judgments/contracts rather than independently rebuilding relations.
5. Close the failing Phase 729 relational-calculus stratum-closure audit and strict relational-authority violations.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- TypeScript 7.0 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
