# Phase 1408 — Upstream Evidence Acquisition and Action Identity Closure

## Migration

The pipeline now separates source-file acquisition from semantic-product production for the model, resource, controller, and service families:

`Laravel source files -> SourceAstEvidenceAcquisitionInterface -> SourceAstFileEvidence[] -> SourceAstSemanticProducerInterface -> ExpressionAst / AssignmentAst / PropertyAst -> CompleteSourceAst -> semantic model and dataflow -> manifest -> wiring/projection -> runtime`

The acquisition contract is closed and immutable. It carries the file family, source path, and source text. The semantic producer consumes those facts and no longer discovers or reads source files itself. Phase 1409 subsequently moved tokenization and method/property syntax parsing behind `SourceAstSyntaxParserInterface`; semantic product construction remains a distinct downstream stage.

The action identity path is now:

`RouteSemanticFlow -> RouteActionIdentityCandidate -> routeActionIdentityCapabilityAuthority -> RouteActionIdentityCapabilityContract -> routeGrouper projection`

The authority rejects duplicate route keys and resolves colliding action names in stable lexical route-key order. The CLI projection no longer allocates suffixes or chooses the final action identity. HTTP method and route path remain transport/coordinate metadata, not action identity inputs.

## Audit

Run:

- `npm run audit:phase1408-upstream-evidence-and-action-identity`
- `npm run audit:phase1407-source-ast-semantic-producer-boundary`
- `npm run audit:phase1406-runtime-contract-migration`
- `npm run audit:phase1309-interface-no-semantic-reasoning`
- `npm run audit:phase1310-downstream-no-method-semantic-fallback`

The Phase 1408 audit is structural; the action identity authority was additionally exercised with reordered candidate input and duplicate route-key rejection. This is not a replacement for a full TypeScript build or Laravel end-to-end test.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic analyses and transformations should use semantic interfaces rather than special-case knowledge of each operation.
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST nodes and data-flow nodes are distinct representations; semantic/dataflow relationships must not be lost during projection.
- TanStack Query query keys: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys — query keys must uniquely identify cached data and include variables that affect the query result.
- Zod basics: https://zod.dev/basics — schemas parse and validate untrusted input; generated schemas must preserve known source evidence rather than silently widening it.
- Axios request configuration: https://axios-http.com/docs/req_config — URL, method, headers, and request body are transport concerns, not the source of Laravel operation semantics.
- TypeScript 7.0 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — native compiler improvements are toolchain improvements, not substitutes for semantic-boundary validation.

## Remaining work

1. Move source-family semantic-origin resolution into a closed upstream reasoning judgment; syntax parsing and semantic product construction are now separate stages.
2. Extend source evidence acquisition to the remaining Laravel source families without bypassing their existing canonical scanner contracts.
3. Resolve the Phase 918 dataflow-boundary failures and Phase 729/strict relational-authority failures at their actual semantic owners.
4. Trace and retire legacy role-based resource descriptor helpers only after all call sites have migrated.
5. Install the repository's declared dependencies and run the full typecheck, build, and ecommerce Laravel fixture integration tests.

## Cross-stack trace (repository paths inspected)

| Boundary | Concrete path(s) | Current responsibility / remaining concern |
|---|---|---|
| Source acquisition | `packages/core/src/compiler/semantic/sourceAstEvidenceAcquisition.ts` | Owns filesystem discovery and reads for model/resource/controller/service PHP files. Other source families still use their canonical scanners. |
| AST and semantic products | `packages/core/src/compiler/semantic/sourceAstSemanticProducer.ts`; `packages/core/src/types/upstream/ast.ts`; `assignment.ts`; `property.ts` | Producer returns typed expression/assignment/property ADTs. Parsing and semantic product selection are not yet separate stages. |
| Semantic capability | `packages/core/src/types/upstream/routeCapabilitySemanticAuthority.ts`; `operationIdentityCapabilityAuthority.ts`; `resourceGroupCapabilityAlgebra.ts`; `routeActionIdentityCapabilityAuthority.ts` | Upstream owns route capability, operation identity, resource-group slots, and final action-name collision resolution. |
| Manifest | `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts`; `packages/core/src/types/upstream/manifest.ts`; `semanticDataflowManifestSurface.ts` | Builder publishes source model, dataflow judgments, and resource-group contracts. Consumers still need a complete no-reclassification audit. |
| Graph | `packages/cli/src/generators/classifier/domainGraphBuilder.ts`; `packages/core/src/types/domain/graphEdgeRelation.ts` | Graph projection consumes semantic route/domain relationships; verify no independent semantic inference is reintroduced in graph builders. |
| IR | `packages/core/src/compiler/scanner/wiring/routeManifestLowerer.ts`; `packages/core/src/types/ir/` | Manifest-to-IR projection is a separate boundary. Dataflow/provenance preservation needs dedicated loss checks, not only type presence checks. |
| SDK and Axios boundary | `packages/cli/src/generators/sdk/apiObjectEmitter.ts`; `packages/sdk/src/defineApi.ts`; `packages/sdk/src/endpoint.ts`; `packages/core/src/client/HttpClient.ts`; `examples/ecommerce-shop-source/frontend/src/lib/core/api-client.ts` | Generator projects operation identity and mapper/schema metadata. Runtime transport execution must consume endpoint metadata, not infer operation meaning. |
| Zod and mapper | `packages/cli/src/generators/canonical/type-mapping/`; `packages/cli/src/generators/sdk/endpointResolver.ts`; `packages/sdk/src/api-runtime/schemaMapper.ts`; `packages/sdk/src/mappers/` | Type/schema mapping and runtime parsing remain distinct. Audit whether unknown/fallback schema values lose upstream field/type evidence. |
| TanStack Query / React | `packages/sdk/src/generateHooks.ts`; `packages/react/src/hooks/define/groupSlotResolver.ts`; `packages/react/src/hooks/define/hookTypes.ts` | React CRUD role scanning fallback is removed; `crudSlots` is a required closed contract. Query-key completeness remains a separate contract correctness requirement. |
| CLI and example | `packages/cli/src/generators/classifier/routeGrouper.ts`; `examples/ecommerce-shop-source/frontend/src/api/hooks.ts` | CLI now consumes upstream action identity. The example's hand-authored empty CRUD slots are explicit, not inferred capabilities. |

## Cross-stack semantic loss checklist

- Operation identity: source route identity -> operation identity capability -> SDK endpoint metadata.
- Resource CRUD slots: upstream route/absent/ambiguous ADT -> manifest capability -> CLI projection -> required React contract.
- Dataflow: source AST and value relations -> `SemanticDataflowJudgment` -> manifest -> consumers. Presence of a dataflow field alone is insufficient; preserve node identity and edge provenance.
- Schema and mapper: source/model/schema facts -> type and mapper generation -> SDK runtime validation. Any fallback to `unknown` must be an explicit contract outcome rather than a silent replacement for known evidence.
- Graph and IR: preserve canonical identity, source provenance, and semantic relations; projection must not manufacture missing judgments.

The external references are design constraints, not proof of RouteSync correctness. MLIR's interface model motivates generic contract consumers; CodeQL's AST/dataflow distinction motivates separate representations; TypeScript 7 improves toolchain performance but does not validate semantic ownership by itself.
