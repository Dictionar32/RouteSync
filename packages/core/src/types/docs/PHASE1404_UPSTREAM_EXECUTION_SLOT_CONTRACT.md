# Phase 1404 — Upstream Execution-Slot Contract

## Objective

Move resource-group CRUD-slot decisions out of the CLI hook generator and into the upstream semantic capability algebra. The CLI may locate a projected route by canonical route identity and print code; it must not scan route roles/scopes to decide which route means `show`, `updateMember`, or `deleteCollection`. React receives the generated `CrudGroupExecutionContract` and executes the supplied endpoints.

## Trace and ownership

| Boundary | Source of truth / responsibility | Current state after Phase 1404 |
|---|---|---|
| Laravel source / `examples/ecommerce-shop-source` | Original route, controller, request, model/resource evidence | Still the source ecosystem; source scanning is not yet fully isolated from semantic traversal |
| `sourceAstScanner.ts` → complete source AST | Extract source evidence and represent syntax | Completeness validation exists; scanner still mixes evidence extraction and semantic traversal (R1) |
| `CompleteLaravelSourceModel` / upstream manifest builder | Preserve source model and construct semantic products before publishing manifest | Existing upstream wiring remains canonical producer |
| Route capability / operation identity capability | Closed route identity, action identity, CRUD role, hook kind, path parameter evidence | Existing route contracts remain the input to the group algebra |
| `resourceGroupCapabilityAlgebra.ts` | Compose group shape and resolve each executable CRUD slot from upstream route capabilities | **Now emits `executionSlots`**, with explicit route / absent / ambiguous ADT outcomes and canonical route/parameter references |
| Manifest and route-manifest lowerer | Transport upstream contracts unchanged | Carries `resourceGroupCapabilities` without recomputing them |
| CLI graph and hook generator | Project resolved contracts into SDK/API and generated hook config | Hook config lowerer now consumes `executionSlots`; its only route lookup is by canonical route identity, not role/scope classification |
| SDK endpoint definitions | Execute request/response contracts and expose endpoint capabilities | Should remain the endpoint execution layer; route slot meaning arrives via generated config |
| React `groupSlotResolver.ts` | Consume explicit `crudSlots`, resolve hooks, execute query/mutation policies | Generated config uses contract path; **legacy hand-authored configs can still trigger role scanning** (R2) |
| Next.js / Axios / Zod / mapper / TanStack Query | Target-side HTTP transport, validation, projection, and caching | Must consume generated request/response/query-key contracts; do not infer Laravel business meaning. Query keys need to uniquely identify data and include variables affecting the result. |
| Graph / IR / dataflow | Preserve distinct structural relations, semantic judgments, and value-flow facts | Do not flatten AST, dataflow graph, route graph, and target projection into one lossy representation |

## New closed ADT

`ResourceGroupSlotDecision` is one of:

- `route`: a canonical route reference with action name, hook kind, target scope, and parameter key when present;
- `absent`: the upstream reasoning found no route for this slot;
- `ambiguous`: multiple routes compete for the same slot; downstream generation fails closed rather than choosing the first match.

The group contract now includes `executionSlots` for index, show, create, member/collection update and delete, and custom endpoints. This resolves the gap where the group contract previously carried only shape/evidence while the generator independently searched for the executable slots.

## Design constraints

1. Source evidence → complete AST/ADT → semantic relation/judgment → closed capability contract → manifest wiring → generator projection → runtime execution.
2. Keep AST and dataflow separate: AST preserves syntax/source structure; dataflow represents value dependencies and can contain nodes not directly represented by AST nodes.
3. Runtime consumes closed contracts. Missing required capabilities must produce a diagnostic, not synthetic defaults or hidden semantic inference.
4. Preserve the algebraic/relation-based composition style. Avoid host `Map`/`Set` and array classifier shortcuts in upstream semantic composition.
5. Stable operation identity and final generated symbol identity must be resolved upstream; CLI duplicate-name suffixing is still a remaining ownership leak (R3).
6. Keep the existing `routesync@1.0.49` package version and `tsdown` build command. Toolchain/build validation is separate from architecture audit status.

## Residuals — explicitly not claimed as complete

- **R1 (high):** `packages/core/src/compiler/scanner/orchestrator/sourceAstScanner.ts` still mixes evidence extraction and semantic traversal. Split the evidence producer from the AST-to-semantic relation authority.
- **R2 (high):** `packages/react/src/hooks/define/groupSlotResolver.ts` retains `firstByRole` compatibility fallback for hand-authored configs without `crudSlots`. Migrate those fixtures/configs before making the contract mandatory and deleting the fallback.
- **R3 (medium):** `packages/cli/src/generators/classifier/routeGrouper.ts` still repairs duplicate action names downstream. Resolve uniqueness/final generated symbol upstream and carry it as contract data.
- **R4 (medium):** `packages/core/src/types/domain/resourceGroupDescriptors.ts` still exposes legacy role-based selection helpers. Trace all callers before retiring compatibility APIs.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic analyses/transforms should operate through semantic interfaces rather than per-operation special cases.
- CodeQL JavaScript/TypeScript dataflow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST nodes and dataflow nodes are related but distinct representations.
- TanStack Query keys: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys — keys must be serializable, unique for the data, and include variables that affect query results.
- TypeScript 7 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — native compiler/toolchain improvements do not replace RouteSync's own semantic-contract audits.
